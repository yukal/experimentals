package main

import (
	"fmt"
	"strings"
)

const INDENT_SIZE = 17
const SEPARATOR = "  │  "

type indentation struct {
	size int
}

type VotesIndicationFormatter struct {
	buf map[int][]string
}

func (ptd *ParsedTenantData) String() string {
	var buf string

	for _, rec := range ptd.Records {
		vote := rec.Vote

		if vote == "" {
			vote = " "
		}

		appartmentLen := len(rec.AppartmentNumber)
		appartmentNum := rec.AppartmentNumber

		if appartmentLen < 2 {
			appartmentNum = "  " + appartmentNum
		} else if appartmentLen < 3 {
			appartmentNum = " " + appartmentNum
		}

		buf += fmt.Sprintf("%s. %.2f [%s] %s\n",
			appartmentNum,
			rec.AppartmentVolume,
			vote,
			rec.OwnerName,
		)
	}

	return buf
}

func (vi *VotesIndication) String() string {
	var buf string

	ind := NewIndentation(INDENT_SIZE)

	formatter := &VotesIndicationFormatter{
		buf: make(map[int][]string),
	}

	formatter.append(formatIndVals(vi.Pros, INDENT_SIZE))
	formatter.append(formatIndVals(vi.Cons, INDENT_SIZE))
	formatter.append(formatIndVals(vi.None, INDENT_SIZE))
	formatter.append(formatTotVals(vi.Total, INDENT_SIZE))
	formatter.append(formatIndVals(vi.Need, INDENT_SIZE))
	formatter.append(formatIndVals(vi.Lack, INDENT_SIZE))

	buf = fmt.Sprintf("%s\n%s\n%s\n%s%s\n\n",
		ind.EmptyLine(6),
		ind.Line("+", "-", "x", "Total", "Target", "Lack"),
		ind.EmptyLine(6),
		formatter.getRows(),
		ind.EmptyLine(6))

	return buf
}

func (i *indentation) Line(values ...string) (row string) {
	var rows []string

	for _, value := range values {
		if len(value) < i.size {
			value += strings.Repeat(" ", i.size-len(value))
		}

		rows = append(rows, value)
	}

	row = strings.Join(rows, SEPARATOR)
	return
}

func (i *indentation) EmptyLine(columns int) (row string) {
	var rows []string
	var n int

	for n < columns {
		n++
		rows = append(rows, strings.Repeat(" ", i.size))
	}

	row = strings.Join(rows, SEPARATOR)
	return
}

func NewIndentation(size int) *indentation {
	return &indentation{size: size}
}

func (f *VotesIndicationFormatter) append(rows ...string) {
	for num, row := range rows {
		f.buf[num] = append(f.buf[num], row)
	}

	return
}

func (f *VotesIndicationFormatter) getRows() (buf string) {
	for _, rows := range f.buf {
		buf += strings.Join(rows, SEPARATOR) + "\n"
	}

	return
}

func formatIndVals(v IndicationValues, size int) (row1, row2 string) {
	ownerAmount := fmt.Sprintf("%d", v.Owner.Amount)
	ownerPercents := fmt.Sprintf("(%.2f%%)", v.Owner.Percents)

	row1 = fmt.Sprintf("%s %s", ownerAmount, ownerPercents)

	if len(row1) < size {
		separator := strings.Repeat(" ", size-len(row1)+1)
		row1 = fmt.Sprintf("%s%s%s", ownerAmount, separator, ownerPercents)
	}

	volumeAmount := fmt.Sprintf("%.2f", v.Volume.Amount)
	volumePercents := fmt.Sprintf("(%.2f%%)", v.Volume.Percents)

	row2 = fmt.Sprintf("%s %s", volumeAmount, volumePercents)

	if len(row2) < size {
		separator := strings.Repeat(" ", size-len(row2)+1)
		row2 = fmt.Sprintf("%s%s%s", volumeAmount, separator, volumePercents)
	}

	return
}

func formatTotVals(t TotalValues, size int) (row1, row2 string) {
	row1 = fmt.Sprintf("%d", t.Owner)
	if len(row1) < size {
		row1 += strings.Repeat(" ", size-len(row1))
	}

	row2 = fmt.Sprintf("%.2f", t.Volume)
	if len(row2) < size {
		row2 += strings.Repeat(" ", size-len(row2))
	}

	return
}
