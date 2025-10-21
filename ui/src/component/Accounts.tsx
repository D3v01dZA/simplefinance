import { useEffect, useState } from "react"
import {
  Button,
  Container,
  Modal,
  Row,
  Form,
  ButtonGroup,
  Table,
  OverlayTrigger,
  Popover,
  Col,
} from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faPenToSquare,
  faPlus,
  faTrash,
  faMoneyBillTransfer,
  faFilter,
} from "@fortawesome/free-solid-svg-icons"
import { useAppDispatch, useAppSelector } from "../app/hooks"
import { selectServer } from "../app/serverSlice"
import { get, err, titleCase, post, del, constrainedPage } from "../util/util"
import {
  AccountType,
  JAccount,
  selectAccounts,
  setAccounts,
} from "../app/accountSlice"
import { LinkContainer } from "react-router-bootstrap"
import { DEFAULT_PAGE_SIZE, Pagination } from "./Pagination"
import { useSearchParams } from "react-router-dom"
import React from "react"
import { cellStyle } from "../util/common"

function Account({
  account,
  edit,
  del,
}: {
  account: JAccount
  edit: () => void
  del: () => void
}) {
  return (
    <tr>
      <td style={cellStyle("100px")}>{titleCase(account.type)}</td>
      <td style={cellStyle("100px")}>{account.name}</td>
      <td style={cellStyle("100px")}>
        <ButtonGroup>
          <LinkContainer to={`/accounts/${account.id}/transactions`}>
            <Button variant="warning">
              <FontAwesomeIcon
                title="Transactions"
                icon={faMoneyBillTransfer}
              />
            </Button>
          </LinkContainer>
          <Button onClick={() => edit()}>
            <FontAwesomeIcon title="Edit" icon={faPenToSquare} />
          </Button>
          <Button variant="danger" onClick={() => del()}>
            <FontAwesomeIcon title="Delete" icon={faTrash} />
          </Button>
        </ButtonGroup>
      </td>
    </tr>
  )
}

function isNameValid(name: string | undefined) {
  if (name === undefined || name === "") {
    return false
  }
  return true
}

function AccountModal({
  show,
  setShow,
  account,
  setAccount,
  saving,
  save,
}: {
  show: boolean
  setShow: (value: boolean) => void
  account: Partial<JAccount>
  setAccount: (account: Partial<JAccount>) => void
  saving: boolean
  save: () => void
}) {
  const isAdd = account.id === undefined

  return (
    <Modal show={show} onHide={() => setShow(false)}>
      <Modal.Header closeButton>
        <Modal.Title>{isAdd ? "Add" : "Edit"} Account</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              isInvalid={!isNameValid(account?.name)}
              value={account?.name}
              onChange={(e) => setAccount({ ...account, name: e.target.value })}
            ></Form.Control>
          </Form.Group>
          <Form.Group>
            <Form.Label>Type</Form.Label>
            <Form.Select
              disabled={!isAdd}
              value={account?.type}
              onChange={(e) =>
                setAccount({ ...account, type: e.target.value as AccountType })
              }
            >
              {Object.keys(AccountType).map((type) => (
                <option key={type} value={type}>
                  {titleCase(type)}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button
          disabled={saving}
          variant="secondary"
          onClick={() => setShow(false)}
        >
          Cancel
        </Button>
        <Button disabled={saving} variant="primary" onClick={() => save()}>
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export function Accounts() {
  const [searchParams, _setSearchParams] = useSearchParams()

  const server = useAppSelector(selectServer)
  const accounts = useAppSelector(selectAccounts)

  const dispatch = useAppDispatch()

  const [accountTypeFilter, setAccountTypeFilter] = useState<
    "none" | AccountType
  >("none")
  const [nameFilter, setNameFilter] = useState("")
  const [filteredAccounts, setFilteredAccounts] = useState<JAccount[]>([])

  const [pageSize, _setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [page, _setPage] = useState(0)

  const [showAdding, setShowAdding] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addingAccount, setAddingAccount] = useState<Partial<JAccount>>({})

  const [showEditing, setShowEditing] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Partial<JAccount>>({})

  function refreshAccounts() {
    function sortAccounts(accounts: JAccount[]) {
      return accounts.sort((left, right) => left.name.localeCompare(right.name))
    }

    get<JAccount[]>(server, "/api/account/")
      .then((accounts) => dispatch(setAccounts(sortAccounts(accounts))))
      .catch((error) => err(error))
  }

  function accountsToDisplay() {
    if (pageSize === 0) {
      return filteredAccounts
    }
    return filteredAccounts.slice(pageSize * page, pageSize * page + pageSize)
  }

  function setPage(newPage: number) {
    const constrained = constrainedPage(
      filteredAccounts.length,
      pageSize,
      newPage,
    )
    setSearchParams("page", constrained + 1)
  }

  function setPageSize(pageSize: number) {
    if (pageSize === DEFAULT_PAGE_SIZE) {
      setSearchParams("pageSize", undefined)
    } else {
      setSearchParams("pageSize", pageSize)
    }
  }

  function setSearchParams(key: string, value: string | number | undefined) {
    if (
      value === undefined ||
      value === "" ||
      value === "none" ||
      value === 1
    ) {
      searchParams.delete(key)
      _setSearchParams(searchParams)
    } else {
      searchParams.set(key, value + "")
      _setSearchParams(searchParams)
    }
  }

  function clearSearchParams() {
    ;[...searchParams.keys()].forEach((key) => searchParams.delete(key))
    _setSearchParams(searchParams)
  }

  useEffect(() => {
    let filtered = Object.values(accounts)
    if (accountTypeFilter !== "none") {
      filtered = Object.values(accounts).filter(
        (account) => account.type === accountTypeFilter,
      )
    }
    if (nameFilter !== "") {
      const filter = nameFilter.toUpperCase()
      filtered = filtered.filter((account) =>
        account.name.toUpperCase().includes(filter),
      )
    }
    setFilteredAccounts(filtered)
  }, [accounts, accountTypeFilter, nameFilter])

  useEffect(() => {
    const transactionType = searchParams.get("type")
    if (transactionType !== null) {
      setAccountTypeFilter(transactionType as AccountType)
    } else {
      setAccountTypeFilter("none")
    }
    const description = searchParams.get("name")
    if (description !== null) {
      setNameFilter(description)
    } else {
      setNameFilter("")
    }
    const page = searchParams.get("page")
    if (page != null) {
      _setPage(parseInt(page) - 1)
    } else {
      _setPage(0)
    }
    const pageSize = searchParams.get("pageSize")
    if (pageSize != null) {
      _setPageSize(parseInt(pageSize))
    } else {
      _setPageSize(DEFAULT_PAGE_SIZE)
    }
  }, [searchParams])

  const clearFilters = (
    <React.Fragment>
      <br />
      <Row>
        <Col>
          <Button
            variant="danger"
            style={{ width: "100%" }}
            onClick={(_) => clearSearchParams()}
          >
            Clear Filters
          </Button>
        </Col>
      </Row>
    </React.Fragment>
  )

  const accountTypeFilterPopover = (
    <Popover>
      <Popover.Body>
        <h6>Local Filters</h6>
        <Form.Group>
          <Form.Label>Type</Form.Label>
          <Form.Select
            value={accountTypeFilter}
            onChange={(e) => setSearchParams("type", e.target.value)}
          >
            <option value={"none"}></option>
            {Object.keys(AccountType).map((type) => (
              <option key={type} value={type}>
                {titleCase(type)}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        {clearFilters}
      </Popover.Body>
    </Popover>
  )

  const nameFilterPopover = (
    <Popover>
      <Popover.Body>
        <h6>Local Filters</h6>
        <Form.Group>
          <Form.Label>Name</Form.Label>
          <Form.Control
            value={nameFilter}
            onChange={(e) => setSearchParams("name", e.target.value)}
          />
        </Form.Group>
        {clearFilters}
      </Popover.Body>
    </Popover>
  )

  return (
    <Container>
      <Row>
        <Col>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>
                  Type{" "}
                  <OverlayTrigger
                    trigger="click"
                    placement="bottom"
                    overlay={accountTypeFilterPopover}
                  >
                    <FontAwesomeIcon
                      color={accountTypeFilter === "none" ? undefined : "blue"}
                      icon={faFilter}
                    />
                  </OverlayTrigger>
                </th>
                <th>
                  Name{" "}
                  <OverlayTrigger
                    trigger="click"
                    placement="bottom"
                    overlay={nameFilterPopover}
                  >
                    <FontAwesomeIcon
                      color={nameFilter === "" ? undefined : "blue"}
                      icon={faFilter}
                    />
                  </OverlayTrigger>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accountsToDisplay().map((account) => (
                <Account
                  key={account.id}
                  account={account}
                  edit={() => {
                    setEditingAccount(account)
                    setShowEditing(true)
                  }}
                  del={() => {
                    if (
                      confirm(
                        `Are you sure you want to delete ${account.name}?`,
                      )
                    ) {
                      del(server, `/api/account/${account.id}/`)
                        .then(() => refreshAccounts())
                        .catch((error) => err(error))
                    }
                  }}
                />
              ))}
              <tr>
                <td></td>
                <td></td>
                <td>
                  <ButtonGroup>
                    <Button
                      variant="success"
                      onClick={() => {
                        setAddingAccount({ type: AccountType.SAVINGS })
                        setShowAdding(true)
                      }}
                    >
                      <FontAwesomeIcon icon={faPlus} />
                    </Button>
                  </ButtonGroup>
                </td>
              </tr>
            </tbody>
          </Table>
        </Col>
      </Row>
      <Pagination
        itemCount={filteredAccounts.length}
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
      />
      <AccountModal
        show={showAdding}
        setShow={setShowAdding}
        account={addingAccount}
        setAccount={setAddingAccount}
        saving={adding}
        save={() => {
          setAdding(true)
          post(server, "/api/account/", addingAccount)
            .then(() => refreshAccounts())
            .catch((error) => err(error))
            .finally(() => {
              setAdding(false)
              setShowAdding(false)
            })
        }}
      />
      <AccountModal
        show={showEditing}
        setShow={setShowEditing}
        account={editingAccount}
        setAccount={setEditingAccount}
        saving={editing}
        save={() => {
          setEditing(true)
          post(server, `/api/account/${editingAccount.id}/`, editingAccount)
            .then(() => refreshAccounts())
            .catch((error) => err(error))
            .finally(() => {
              setEditing(false)
              setShowEditing(false)
            })
        }}
      />
    </Container>
  )
}
