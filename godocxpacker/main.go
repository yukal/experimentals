package main

import (
	"github.com/yukal/godocxpacker/src/db/sqlite"
	"github.com/yukal/godocxpacker/src/structs"
	"github.com/yukal/godocxpacker/src/tpl"
)

func main() {
	db, err := sqlite.New("data/appartments.db")

	if err != nil {
		panic(err)
	}

	tenants, err := db.GetTenants()

	if err != nil {
		panic(err)
	}

	data := &structs.DocxTemplate{
		Docx: structs.DocxMetadata{
			Creator:        "РЦ ОСББ",
			LastModifiedBy: "Go Builder",
			Language:       "uk-UA",
		},

		Osbb: structs.OSBBData{
			Name: "Мрія‑8",

			Address: structs.OSBBAddress{
				PostIndex:       81012,
				City:            "Київ",
				Street:          "Марії Литвиненко‑Вольгемут",
				StreetShortName: "Литвиненко",
				House:           8,
			},

			Event: structs.OSBBEvent{
				Token: "2023-02-15T13:00:00.000Z",
				Date:  "«27» Листопада 2022 року",
				Year:  2022,
				Day:   27,
				Time:  "15:00",
				Month: "Листопада",
			},

			Persons: structs.OSBBPersons{
				General:   "Хмельницкий Богдан Михайлович",
				Secretary: "Косач Лариса Петрівна",
				Auditor:   "Леонтович Микола Дмитрович",
			},

			GeneralMembers: []string{
				"Хмельницкий Богдан Михайлович",
				"Косач Лариса Петрівна",
				"Коцюбинський Михайло Михайлович",
				"Грушевська Марія Сильвестрівна",
			},
		},

		Votings: structs.OSBBVotings{
			TotalTenantsCount:       275,
			TotalVolumes:            "9362,4",
			TotalTenantsByProtocol1: 115,
			TotalVolumesByProtocol1: "3927,84",
			TotalTenantsByProtocol2: 41,
			TotalVolumesByProtocol2: "1363,76",
		},

		Tenants: tenants,
	}

	cpl := tpl.New(tpl.TmplBuilderPaths{
		Templates: "data/templates",
		Build:     "data/build",
	})

	if err = cpl.Build(data); err != nil {
		panic(err)
	}
}
