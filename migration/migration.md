Usage:
  migration up,down,gen,ls,list

  up:

    migration up [, rule ]
      rule (optional):

      - "1-4"       migrate only matched items: 1,2,3,4
      - "1,4,8,10"  migrate only matched items: 1,4,8,10
      - "1-4;8-10"  migrate only matched items: 1,2,3,4,8,9,10

  down:

    migration down [, rule ]
      rule (optional):

      - "1-4"       migrate only matched items: 1,2,3,4
      - "1,4,8,10"  migrate only matched items: 1,4,8,10
      - "1-4;8-10"  migrate only matched items: 1,2,3,4,8,9,10

  gen:

    migration gen id,up,dn

    - id:

      generates a migration Id

      examples:
        migration gen id [, description ]

        migration gen id
        migration gen id "create table user"
        migration gen id "modify table user"
        migration gen id "fill table user"
        migration gen id "drop table user"

      result:
        - 20221014074255261189e05
        - 202210140743241210caa47-CreateTableUser
        - 202210140743501801ebeab-ModifyTableUser
        - 2022101407455218857ba97-FillTableUser
        - 202210140746411181bc6d5-DropTableUser


    - up:

      generates a migration Id and creates a blank file with up strategy

      examples:
        migration gen up [, description ]

        migration gen up
        migration gen up "create table user"
        migration gen up "modify table user"
        migration gen up "fill table user"

    - dn:

      generates a migration Id and creates a blank file with down strategy

      examples:
        migration gen dn [, description ]

        migration gen dn
        migration gen dn "truncate table user"
        migration gen dn "drop table user"

  ls:

    migration ls [, params]
      params (optional):

      - up          show only up migrations
      - dn          show only down migrations
      - down        alias for dn command

  list:

    Same as ls. It's just an alias.
