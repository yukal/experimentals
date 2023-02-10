package tpl

import (
	"archive/zip"
	"bytes"
	"io"
	"os"
)

type ZPack struct {
	file   *os.File
	writer *zip.Writer
}

func (z *ZPack) FromPath(srcPath, dstPath string) (int64, error) {
	var bytesWritten int64

	srcFile, err := os.Open(srcPath)

	if err != nil {
		return bytesWritten, err
	}

	defer srcFile.Close()

	dstFile, err := z.writer.Create(dstPath)

	if err != nil {
		return bytesWritten, err
	}

	bytesWritten, err = io.Copy(dstFile, srcFile)

	if err != nil {
		return bytesWritten, err
	}

	return bytesWritten, nil
}

func (z *ZPack) FromBuff(buff *bytes.Buffer, dstPath string) (int64, error) {
	var bytesWritten int64

	dstFile, err := z.writer.Create(dstPath)

	if err != nil {
		return bytesWritten, err
	}

	bytesWritten, err = io.Copy(dstFile, buff)

	if err != nil {
		return bytesWritten, err
	}

	return bytesWritten, nil
}

func (z *ZPack) Close() {
	defer z.file.Close()
	defer z.writer.Close()
}
