package main

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"math"
	"os"
	"strconv"
	"strings"

	"github.com/xuri/excelize/v2"
)

func (ptd *ParsedTenantData) Calc(passingRate string) *VotesIndication {
	res := &VotesIndication{}
	totalRows := len(ptd.Records)

	appartmentMap := make(map[string]float64, totalRows)
	ownersMap := make(map[string]byte, totalRows)

	for _, item := range ptd.Records {
		// TODO: Improve calculation of the same owner (not by name, but by ID)
		if _, ok := ownersMap[item.OwnerName]; !ok {
			ownersMap[item.OwnerName] = 1
			res.Total.Owner++
		} else {
			ownersMap[item.OwnerName] += 1
		}

		if _, ok := appartmentMap[item.AppartmentNumber]; !ok {
			appartmentMap[item.AppartmentNumber] = item.AppartmentVolume
			res.Total.Volume += item.AppartmentVolume
		}

		if tenantsInAppartment, ok := ptd.tenants[item.AppartmentNumber]; ok {
			item.OwnerVolume = item.AppartmentVolume / float64(tenantsInAppartment)
		}

		switch item.Vote {
		case "+":
			res.Pros.Owner.Amount += 1
			res.Pros.Volume.Amount += item.OwnerVolume
		case "-":
			res.Cons.Owner.Amount += 1
			res.Cons.Volume.Amount += item.OwnerVolume
		// case " ":
		// 	res.None.Owner.Amount += 1
		// 	res.None.Volume.Amount += item.OwnerVolume
		default:
			res.None.Owner.Amount += 1
			res.None.Volume.Amount += item.OwnerVolume
		}
	}

	res.Pros.Owner.Percents = float64(res.Pros.Owner.Amount) * 100 / float64(res.Total.Owner)
	res.Pros.Volume.Percents = res.Pros.Volume.Amount * 100 / res.Total.Volume

	res.Cons.Owner.Percents = float64(res.Cons.Owner.Amount) * 100 / float64(res.Total.Owner)
	res.Cons.Volume.Percents = res.Cons.Volume.Amount * 100 / res.Total.Volume

	res.None.Owner.Percents = float64(res.None.Owner.Amount) * 100 / float64(res.Total.Owner)
	res.None.Volume.Percents = res.None.Volume.Amount * 100 / res.Total.Volume

	rate := parseRate(passingRate)

	res.Need.Owner.Amount = int(math.Ceil(rate * float64(res.Total.Owner)))
	res.Need.Owner.Percents = float64(res.Need.Owner.Amount) * 100 / float64(res.Total.Owner)
	res.Need.Volume.Amount = rate * res.Total.Volume
	res.Need.Volume.Percents = res.Need.Volume.Amount * 100 / res.Total.Volume

	res.Lack.Owner.Amount = res.Need.Owner.Amount - res.Pros.Owner.Amount
	res.Lack.Owner.Percents = res.Need.Owner.Percents - res.Pros.Owner.Percents
	res.Lack.Volume.Amount = res.Need.Volume.Amount - res.Pros.Volume.Amount
	res.Lack.Volume.Percents = res.Need.Volume.Percents - res.Pros.Volume.Percents

	return res
}

func FromCSV(filePath string) *ParsedTenantData {
	file, err := os.Open(filePath)
	if err != nil {
		panic(err)
	}
	defer file.Close()

	r := csv.NewReader(file)

	records := []TenantData{}
	tenants := make(map[string]int)

	for {
		row, err := r.Read()

		if err == io.EOF {
			break
		}

		if err != nil {
			panic(err)
		}

		data := parseDocumentRow(row)

		if _, ok := tenants[data.AppartmentNumber]; !ok {
			tenants[data.AppartmentNumber] = 1
		} else {
			tenants[data.AppartmentNumber] += 1
		}

		records = append(records, data)
	}

	return &ParsedTenantData{
		Records: records,
		tenants: tenants,
	}
}

func FromJSON(filename string) *ParsedTenantData {
	jsonFile, err := os.Open(filename)

	if err != nil {
		panic(err)
	}

	defer jsonFile.Close()

	records := []TenantData{}
	tenants := make(map[string]int)

	bytes, _ := ioutil.ReadAll(jsonFile)
	json.Unmarshal(bytes, &records)

	for _, data := range records {
		if _, ok := tenants[data.AppartmentNumber]; !ok {
			tenants[data.AppartmentNumber] = 1
		} else {
			tenants[data.AppartmentNumber] += 1
		}
	}

	return &ParsedTenantData{
		Records: records,
		tenants: tenants,
	}
}

func FromXLSX(filename string) *ParsedTenantData {
	file, err := excelize.OpenFile(filename)
	if err != nil {
		panic(err)
	}

	defer func() {
		// Close the spreadsheet.
		if err := file.Close(); err != nil {
			fmt.Println(err)
		}
	}()

	rows, err := file.GetRows("votes")
	if err != nil {
		panic(err)
	}

	rowsSlice := rows[1:]

	records := []TenantData{}
	tenants := make(map[string]int, len(rowsSlice))

	for _, row := range rowsSlice {
		data := parseDocumentRow(row)

		if _, ok := tenants[data.AppartmentNumber]; !ok {
			tenants[data.AppartmentNumber] = 1
		} else {
			tenants[data.AppartmentNumber] += 1
		}

		records = append(records, data)
	}

	return &ParsedTenantData{
		Records: records,
		tenants: tenants,
	}
}

func parseDocumentRow(record []string) TenantData {
	appartmentVolume, err := strconv.ParseFloat(record[1], 64)

	if err != nil {
		panic(err)
	}

	// ownerVolume, err := strconv.ParseFloat(record[3], 64)

	// if err != nil {
	// 	panic(err)
	// }

	return TenantData{
		AppartmentNumber: record[0],
		AppartmentVolume: appartmentVolume,
		Vote:             record[2],
		// OwnerVolume:      ownerVolume,
		OwnerVolume: 0,
		OwnerName:   record[3],
	}
}

func parseRate(rate string) float64 {
	chunks := strings.Split(rate, "/")

	num1, err := strconv.ParseFloat(chunks[0], 64)

	if err != nil {
		panic(err)
	}

	num2, err := strconv.ParseFloat(chunks[1], 64)

	if err != nil {
		panic(err)
	}

	return num1 / num2
}
