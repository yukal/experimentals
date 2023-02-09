package structs

type OSBBAddress struct {
	PostIndex       uint64
	City            string
	Street          string
	StreetShortName string
	House           uint
}

type OSBBEvent struct {
	Token string
	Date  string
	Year  uint
	Day   byte
	Time  string
	Month string
}

type OSBBPersons struct {
	General   string
	Secretary string
	Auditor   string
}

type OSBBVotings struct {
	TotalTenantsCount uint16
	TotalVolumes      string

	TotalTenantsByProtocol1 uint16
	TotalVolumesByProtocol1 string

	TotalTenantsByProtocol2 uint16
	TotalVolumesByProtocol2 string
}

type OSBBTenant struct {
	AppartmentNumber string
	AppartmentVolume float32
	TenantId         uint16
	LastName         string
	FirstName        string
	Patronymic       string
	Vote             bool
	Prescript        string
}

type OSBBData struct {
	Name           string
	Address        OSBBAddress
	Event          OSBBEvent
	Persons        OSBBPersons
	GeneralMembers []string
}
