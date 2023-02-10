package sqlite

import (
	"database/sql"
	"log"

	_ "github.com/mattn/go-sqlite3"
	"github.com/yukal/experimentals/godocxpacker/src/structs"
)

type SqliteConnection struct {
	db *sql.DB
}

func New(sqliteFile string) (*SqliteConnection, error) {
	db, err := sql.Open("sqlite3", sqliteFile)

	if err != nil {
		return nil, err
	}

	sqlcon := &SqliteConnection{
		db: db,
	}

	return sqlcon, nil
}

func (sqlcon *SqliteConnection) GetTenants() ([]structs.OSBBTenant, error) {
	tenants := []structs.OSBBTenant{}
	query := `
    SELECT
      tenant_appartment.appartment_number,
      appartment.appartment_volume,
      tenant.tenant_id,
      tenant.last_name,
      tenant.first_name,
      tenant.patronymic,
      tenant_appartment_voting.vote,
      ownership.ownership_prescript
    FROM
      tenant
      LEFT JOIN tenant_appartment ON tenant_appartment.tenant_id = tenant.tenant_id
      LEFT JOIN tenant_appartment_voting ON tenant_appartment_voting.tenant_appartment_id = tenant_appartment.tenant_appartment_id
      LEFT JOIN tenant_appartment_ownership ON tenant_appartment_ownership.tenant_appartment_id = tenant_appartment.tenant_appartment_id
      LEFT JOIN appartment ON appartment.appartment_number = tenant_appartment.appartment_number
      LEFT JOIN ownership ON ownership.ownership_id = tenant_appartment_ownership.ownership_id
    WHERE
      tenant_appartment_voting.voting_id = ?
      AND tenant.is_active = ?`

	rows, err := sqlcon.db.Query(query, 1, true)

	if err != nil {
		return tenants, err
	}

	defer rows.Close()

	for rows.Next() {
		tenant := structs.OSBBTenant{}

		err = rows.Scan(
			&tenant.AppartmentNumber,
			&tenant.AppartmentVolume,
			&tenant.TenantId,
			&tenant.LastName,
			&tenant.FirstName,
			&tenant.Patronymic,
			&tenant.Vote,
			&tenant.Prescript,
		)

		if err != nil {
			log.Fatal(err)
			continue
		}

		tenants = append(tenants, tenant)
	}

	return tenants, nil
}
