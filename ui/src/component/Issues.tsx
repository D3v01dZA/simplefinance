import {
  Button,
  ButtonGroup,
  Col,
  Container,
  Row,
  Table,
} from "react-bootstrap"
import { useAppSelector } from "../app/hooks"
import { selectServer } from "../app/serverSlice"
import { selectSettings } from "../app/settingSlice"
import { selectAccounts } from "../app/accountSlice"
import { useEffect, useState } from "react"
import {
  constrainedPage,
  defaultAccountId,
  err,
  get,
  post,
  sortTransactions,
  titleCase,
  today,
} from "../util/util"
import { DEFAULT_PAGE_SIZE, Pagination } from "./Pagination"
import { useSearchParams } from "react-router-dom"
import { AccountName, cellStyle } from "../util/common"
import {
  TransactionModal,
  WorkingTransaction,
} from "./sub-component/TransactionModal"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faBalanceScale,
  faCartPlus,
  faWrench,
} from "@fortawesome/free-solid-svg-icons"
import { JTranscation, TransactionType } from "./Transactions"
import {
  BalanceAddingTranscations,
  BalanceTransactionModal,
} from "./sub-component/BalanceTransactionModal"
import {
  BulkTransactionModal,
  BulkWorkingTransactions,
  BulkWorkingTransactionsTransaction,
} from "./sub-component/BulkTransactionModal"

enum IssueType {
  TRANSFER_WITHOUT_BALANCE = "TRANSFER_WITHOUT_BALANCE",
  NO_BALANCE = "NO_BALANCE",
  NO_TRANSFER = "NO_TRANSFER",
}

interface JIssue {
  type: IssueType
  accountId: string
  date: string
  fromAccountId?: string
}

export function Issues() {
  const [searchParams, _setSearchParams] = useSearchParams()

  const server = useAppSelector(selectServer)
  const accounts = useAppSelector(selectAccounts)
  const settings = useAppSelector(selectSettings)

  const [issues, setIssues] = useState<JIssue[]>([])

  const [pageSize, _setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [page, _setPage] = useState(0)

  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [savingTransaction, setSavingTransaction] = useState(false)
  const [transaction, setTransaction] = useState<Partial<WorkingTransaction>>(
    {},
  )

  const [transactions, setTransactions] = useState<JTranscation[]>([])

  const [showBalanceAdding, setShowBalanceAdding] = useState(false)
  const [balanceAdding, setBalanceAdding] = useState(false)
  const [balanceAddingDate, setBalanceAddingDate] = useState(today())
  const [balanceAddingTransactions, setBalanceAddingTransactions] =
    useState<BalanceAddingTranscations>({})
  const [specificAccounts, setSpecificAccounts] = useState<string[]>([])

  const [showBulkAdding, setShowBulkAdding] = useState(false)
  const [bulkAdding, setBulkAdding] = useState(false)
  const [bulkAddingTransactions, setBulkAddingTransactions] =
    useState<BulkWorkingTransactions>(bulkTranscationsDefault())

  function bulkTranscationsDefault(
    transaction?: BulkWorkingTransactionsTransaction,
  ) {
    let bulk: BulkWorkingTransactions = {
      description: "",
      date: today(),
      type: TransactionType.TRANSFER,
      fromAccountId: defaultAccountId(settings, accounts),
      transactions: [],
    }
    if (transaction !== undefined) {
      bulk.transactions.push(transaction)
    }
    return bulk
  }

  function refresh() {
    function sortIssues(issues: JIssue[]) {
      return issues.sort((left, right) => {
        let issueType = right.type.localeCompare(left.type)
        if (issueType != 0) {
          return issueType
        }
        let date = Date.parse(right.date) - Date.parse(left.date)
        if (date != 0) {
          return date
        }
        return right.accountId.localeCompare(left.accountId)
      })
    }

    get<JIssue[]>(server, `/api/issue/`)
      .then((issues) => setIssues(sortIssues(issues)))
      .catch((error) => err(error))
    get<JTranscation[]>(server, `/api/transaction/`)
      .then((transactions) => setTransactions(sortTransactions(transactions)))
      .catch((error) => err(error))
  }

  function issuesToDisplay() {
    if (pageSize === 0) {
      return issues
    }
    return issues.slice(pageSize * page, pageSize * page + pageSize)
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

  function setPage(newPage: number) {
    const constrained = constrainedPage(issues.length, pageSize, newPage)
    setSearchParams("page", constrained + 1)
  }

  function setPageSize(pageSize: number) {
    if (pageSize === DEFAULT_PAGE_SIZE) {
      setSearchParams("pageSize", undefined)
    } else {
      setSearchParams("pageSize", pageSize)
    }
  }

  function isBalance(type: IssueType) {
    return (
      type === IssueType.NO_BALANCE ||
      type === IssueType.TRANSFER_WITHOUT_BALANCE
    )
  }

  useEffect(() => refresh(), [])

  useEffect(() => {
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

  return (
    <Container>
      <Row>
        <Col>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Type</th>
                <th>Date</th>
                <th>Account</th>
                <th>From Account</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {issuesToDisplay().map((issue, index) => (
                <tr key={index}>
                  <td style={cellStyle("100px")}>{titleCase(issue.type)}</td>
                  <td style={cellStyle("100px")}>{issue.date}</td>
                  <td style={cellStyle("200px")}>
                    <AccountName
                      accounts={accounts}
                      accountId={issue.accountId}
                    />
                  </td>
                  <td style={cellStyle("200px")}>
                    {issue.fromAccountId === undefined ? null : (
                      <AccountName
                        accounts={accounts}
                        accountId={issue.fromAccountId}
                      />
                    )}
                  </td>
                  <td style={cellStyle("100px")}>
                    <ButtonGroup>
                      {isBalance(issue.type) ? (
                        <>
                          <Button
                            variant="warning"
                            onClick={() => {
                              setBalanceAddingTransactions({})
                              setBalanceAddingDate(issue.date)
                              let accountIds = issues
                                .filter(
                                  (potential) => potential.date === issue.date,
                                )
                                .map((potential) => potential.accountId)
                              setSpecificAccounts(accountIds)
                              setShowBalanceAdding(true)
                            }}
                          >
                            <FontAwesomeIcon icon={faBalanceScale} />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="primary"
                            onClick={() => {
                              let bulk: BulkWorkingTransactions = {
                                description: "",
                                date: issue.date,
                                type: TransactionType.TRANSFER,
                                fromAccountId: issue.fromAccountId!,
                                transactions: [],
                              }
                              issues.forEach((other) => {
                                if (
                                  other.type === issue.type &&
                                  other.date === issue.date &&
                                  other.fromAccountId === issue.fromAccountId
                                ) {
                                  bulk.transactions.push({
                                    accountId: other.accountId,
                                  })
                                }
                              })
                              setBulkAddingTransactions(bulk)
                              setShowBulkAdding(true)
                            }}
                          >
                            <FontAwesomeIcon icon={faCartPlus} />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="success"
                        onClick={() => {
                          setTransaction({
                            date: issue.date,
                            description: "",
                            type: isBalance(issue.type)
                              ? TransactionType.BALANCE
                              : TransactionType.TRANSFER,
                            accountId: issue.accountId,
                            fromAccountId: issue.fromAccountId,
                          })
                          setShowTransactionModal(true)
                        }}
                      >
                        <FontAwesomeIcon icon={faWrench} />
                      </Button>
                    </ButtonGroup>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination
            itemCount={issues.length}
            page={page}
            setPage={setPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
          />
          <TransactionModal
            accounts={accounts}
            settings={settings}
            singleAccount={true}
            singleType={true}
            singleDate={true}
            show={showTransactionModal}
            setShow={setShowTransactionModal}
            transaction={transaction}
            setTransaction={setTransaction}
            saving={savingTransaction}
            save={() => {
              setSavingTransaction(true)
              post(server, `/api/transaction/`, transaction)
                .then(() => refresh())
                .catch((error) => err(error))
                .finally(() => {
                  setSavingTransaction(false)
                  setShowTransactionModal(false)
                })
            }}
          />
          <BulkTransactionModal
            accounts={accounts}
            settings={settings}
            specific={true}
            show={showBulkAdding}
            setShow={setShowBulkAdding}
            transactions={bulkAddingTransactions}
            setTransactions={setBulkAddingTransactions}
            saving={bulkAdding}
            save={() => {
              setBulkAdding(true)
              Promise.all(
                bulkAddingTransactions.transactions.map((transaction) =>
                  post(server, `/api/transaction/`, {
                    ...bulkAddingTransactions,
                    ...transaction,
                  }),
                ),
              )
                .then(() => refresh())
                .catch((error) => err(error))
                .finally(() => {
                  setBulkAdding(false)
                  setShowBulkAdding(false)
                })
            }}
          />
          <BalanceTransactionModal
            accounts={accounts}
            settings={settings}
            specificAccounts={specificAccounts}
            show={showBalanceAdding}
            setShow={setShowBalanceAdding}
            date={balanceAddingDate}
            setDate={setBalanceAddingDate}
            transactions={transactions}
            balanceAddingTransactions={balanceAddingTransactions}
            setBalanceAddingTransactions={setBalanceAddingTransactions}
            saving={balanceAdding}
            save={() => {
              setBalanceAdding(true)
              Promise.all(
                Object.entries(balanceAddingTransactions).map(([id, value]) => {
                  let transaction = {
                    description: "",
                    accountId: id,
                    date: balanceAddingDate,
                    value: value,
                    type: TransactionType.BALANCE,
                  }
                  return post(server, `/api/transaction/`, transaction)
                }),
              )
                .then(() => refresh())
                .catch((error) => err(error))
                .finally(() => {
                  setBalanceAdding(false)
                  setShowBalanceAdding(false)
                  setSpecificAccounts([])
                })
            }}
          />
        </Col>
      </Row>
    </Container>
  )
}
