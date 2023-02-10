package tpl

import (
	"archive/zip"
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"os"
	"path"
	"path/filepath"
	"strings"
	"text/template"

	"github.com/yukal/godocxpacker/src/structs"
)

const _FILEPATH_SEPARATOR = string(filepath.Separator)

type TmplBuilderPaths struct {
	Templates string
	Build     string
}

type templateBuilderPaths struct {
	Templates string
	Build     string
	Docs      string
	Parts     string
}

type TemplateBuilder struct {
	paths *templateBuilderPaths
	// data  *structs.DocxTemplate
}

func New(paths TmplBuilderPaths) *TemplateBuilder {
	return &TemplateBuilder{
		paths: &templateBuilderPaths{
			Templates: paths.Templates,
			Build:     paths.Build,
			Docs:      path.Join(paths.Templates, "docs"),
			Parts:     path.Join(paths.Templates, "parts"),
		},
		// data:  data,
	}
}

func (t *TemplateBuilder) getNamespace(currPath string) string {
	tmplContextPath := strings.Replace(currPath, t.paths.Docs, "", 1)

	if strings.HasPrefix(tmplContextPath, _FILEPATH_SEPARATOR) {
		tmplContextPath = tmplContextPath[1:]
	}

	index := strings.Index(tmplContextPath, _FILEPATH_SEPARATOR)

	if index != -1 {
		tmplContextPath = tmplContextPath[:index]
	}

	return tmplContextPath
}

func (t *TemplateBuilder) getPathPackingFile(currPath string) string {
	namespace := t.getNamespace(currPath)
	filePath := strings.Replace(currPath,
		filepath.Join(t.paths.Docs, namespace), "", 1)

	if strings.HasPrefix(filePath, _FILEPATH_SEPARATOR) {
		filePath = filePath[1:]
	}

	if strings.HasSuffix(filePath, ".tpl") {
		return filePath[:len(filePath)-4]
	}

	return filePath
}

func (t *TemplateBuilder) Build(data *structs.DocxTemplate) error {
	tmplMaster, err := template.ParseGlob(
		path.Join(t.paths.Templates, "basic/*.tpl"))

	if err != nil {
		return err
	}

	var isOk bool
	var zpack *ZPack
	var tmplOverlay *template.Template

	templates := make(map[string]*template.Template)
	zpacks := make(map[string]*ZPack)

	err = filepath.Walk(t.paths.Docs, func(currPath string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() {
			return nil
		}

		namespace := t.getNamespace(currPath)

		if zpack, isOk = zpacks[namespace]; !isOk {
			fmt.Println(namespace)

			buf := make([]byte, 8)
			_, err := rand.Read(buf)

			if err != nil {
				return err
			}

			filename := hex.EncodeToString(buf) + ".zip"
			zipFile, err := os.Create(filename)
			// zipFile, err := os.Create(namespace + ".zip")

			if err != nil {
				return err
			}

			// defer zipFile.Close()

			// zipWriter := zip.NewWriter(zipFile)
			// defer zipWriter.Close()

			zpack = &ZPack{
				file:   zipFile,
				writer: zip.NewWriter(zipFile),
			}

			zpacks[namespace] = zpack
		}

		pathPackingFile := t.getPathPackingFile(currPath)

		if !strings.HasSuffix(currPath, ".tpl") {
			bytesWritten, err := zpack.addFromPath(currPath, pathPackingFile)

			if err != nil {
				return err
			}

			fmt.Printf("%s -> %#v (%#v)\n", zpack.file.Name(), pathPackingFile, bytesWritten)
			return nil
		}

		if tmplOverlay, isOk = templates[namespace]; !isOk {
			tmplOverlay = template.Must(tmplMaster.Clone())

			_, err := tmplOverlay.ParseGlob(
				path.Join(t.paths.Parts, namespace, "*.tpl"))

			if err != nil {
				return err
			}

			templates[namespace] = tmplOverlay
		}

		curFilename := path.Base(currPath)
		_, err = tmplOverlay.New(curFilename).ParseFiles(currPath)

		if err != nil {
			return err
		}

		buff := new(bytes.Buffer)
		err = tmplOverlay.ExecuteTemplate(buff, curFilename, data)

		bytesWritten, err := zpack.addFromBuff(buff, pathPackingFile)
		fmt.Printf("%s -> %#v (%#v)\n", zpack.file.Name(), pathPackingFile, bytesWritten)

		if err != nil {
			return err
		}

		return nil
	})

	for _, zpack = range zpacks {
		zpack.Close()
		// defer zpack.file.Close()
		// defer zpack.writer.Close()
	}

	// if err != nil {
	// 	panic(err)
	// }

	return err
}
