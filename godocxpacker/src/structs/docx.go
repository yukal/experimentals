package structs

import "time"

type DocxData struct {
	Creator        string
	LastModifiedBy string
	Language       string
	Timestamp      func()
}

type DocxMetadata struct {
	Creator        string
	LastModifiedBy string
	Language       string
}

type DocxTemplate struct {
	Docx    DocxMetadata
	Osbb    OSBBData
	Votings OSBBVotings
	Tenants []OSBBTenant
}

func (tpl *DocxTemplate) Timestamp() string {
	return time.Now().Format(time.RFC3339)
}
