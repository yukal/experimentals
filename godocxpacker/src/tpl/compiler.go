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

	"github.com/yukal/experimentals/godocxpacker/src/structs"
)

const _FILEPATH_SEPARATOR = string(filepath.Separator)

type TmplCompilerPaths struct {
	App   string
	Build string
	Parts string
	Docs  string
}

type TemplateCompiler struct {
	paths *TmplCompilerPaths
	// data  *structs.DocxTemplate
}

func New(paths *TmplCompilerPaths) *TemplateCompiler {
	return &TemplateCompiler{
		paths: paths,
		// data:  data,
	}
}

func (t *TemplateCompiler) getNamespace(currPath string) string {
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

func (t *TemplateCompiler) getPathPackingFile(currPath string) string {
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

func (t *TemplateCompiler) Compile(data *structs.DocxTemplate) error {
	tmplMaster, err := template.ParseGlob(
		path.Join(t.paths.App, "basic/*.tpl"))

	if err != nil {
		return err
	}

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

		if _, zpackOk := zpacks[namespace]; !zpackOk {
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

			zipWriter := zip.NewWriter(zipFile)
			// defer zipWriter.Close()

			zpacks[namespace] = &ZPack{
				file:   zipFile,
				writer: zipWriter,
			}
		}

		zpack = zpacks[namespace]
		pathPackingFile := t.getPathPackingFile(currPath)

		if !strings.HasSuffix(currPath, ".tpl") {
			bytesWritten, err := zpack.FromPath(currPath, pathPackingFile)

			if err != nil {
				return err
			}

			fmt.Printf("%s -> %#v (%#v)\n", zpack.file.Name(), pathPackingFile, bytesWritten)
			return nil
		}

		if _, tplOk := templates[namespace]; !tplOk {
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

		bytesWritten, err := zpack.FromBuff(buff, pathPackingFile)
		fmt.Printf("%s -> %#v (%#v)\n", zpack.file.Name(), pathPackingFile, bytesWritten)

		if err != nil {
			return err
		}

		return nil
	})

	for _, zpack = range zpacks {
		defer zpack.Cleanup()
		// defer zpack.file.Close()
		// defer zpack.writer.Close()
	}

	// if err != nil {
	// 	panic(err)
	// }

	return err
}
