package main

type TenantData struct {
	AppartmentNumber string
	AppartmentVolume float64
	Vote             string
	OwnerVolume      float64
	OwnerName        string
}

type ParsedTenantData struct {
	Records []TenantData
	tenants map[string]int
}

type OwnerValues struct {
	Amount   int
	Percents float64
}

type VolumeValues struct {
	Amount   float64
	Percents float64
}

type IndicationValues struct {
	Owner  OwnerValues
	Volume VolumeValues
}

type TotalValues struct {
	Owner  int
	Volume float64
}

type VotesIndication struct {
	Pros IndicationValues
	Cons IndicationValues
	None IndicationValues

	Need IndicationValues
	Lack IndicationValues

	Total TotalValues
}
