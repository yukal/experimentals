package main

import (
	"fmt"
)

func main() {
	// data := FromCSV("votes.csv")
	// data := FromJSON("votes.json")
	data := FromXLSX("votes.xlsx")

	fmt.Println(data.Calc("2/3"))
}
