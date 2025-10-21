import { Button, ButtonGroup, Col, Form, Modal, Row } from "react-bootstrap"
import { IndexedAccounts } from "../../app/accountSlice"
import { IndexedSettings } from "../../app/settingSlice"
import { TransactionType } from "../Transactions"
import { defaultAccountId, isValueValid, titleCase } from "../../util/util"
import React from "react"

export interface BulkWorkingTransactionsTransaction {
  accountId: string
  value?: string
}

export interface BulkWorkingTransactions {
  description: string
  date: string
  type: TransactionType
  fromAccountId?: string
  transactions: BulkWorkingTransactionsTransaction[]
}

export function BulkTransactionModal({
  accounts,
  settings,
  specific,
  show,
  setShow,
  transactions,
  setTransactions,
  saving,
  save,
}: {
  accounts: IndexedAccounts
  settings: IndexedSettings
  specific: boolean
  show: boolean
  setShow: (value: boolean) => void
  transactions: BulkWorkingTransactions
  setTransactions: (transactions: BulkWorkingTransactions) => void
  saving: boolean
  save: () => void
}) {
  function editTransaction(
    index: number,
    update: Partial<{ accountId: string; value: string }>,
  ) {
    const updatedTransactions = [...transactions.transactions]
    updatedTransactions[index] = {
      ...updatedTransactions[index],
      ...update,
    }
    setTransactions({ ...transactions, transactions: updatedTransactions })
  }

  function deleteTransaction(index: number) {
    const updatedTransactions = [...transactions.transactions]
    updatedTransactions.splice(index, 1)
    setTransactions({ ...transactions, transactions: updatedTransactions })
  }

  return (
    <Modal show={show} onHide={() => setShow(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Add Multiple Transactions</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Label>Description</Form.Label>
            <Form.Control
              type="text"
              value={transactions?.description}
              onChange={(e) =>
                setTransactions({
                  ...transactions,
                  description: e.target.value,
                })
              }
            ></Form.Control>
          </Form.Group>
          <Form.Group>
            <Form.Label>Date</Form.Label>
            <Form.Control
              type="date"
              disabled={specific}
              value={transactions?.date}
              onChange={(e) =>
                setTransactions({ ...transactions, date: e.target.value })
              }
            ></Form.Control>
          </Form.Group>
          <Form.Group>
            <Form.Label>Type</Form.Label>
            <Form.Select
              disabled={specific}
              value={transactions.type}
              onChange={(e) => {
                const type = e.target.value as TransactionType
                const fromAccountId =
                  type === TransactionType.TRANSFER
                    ? defaultAccountId(settings, accounts)
                    : undefined
                setTransactions({ ...transactions, fromAccountId, type })
              }}
            >
              {Object.keys(TransactionType).map((type) => (
                <option key={type} value={type}>
                  {titleCase(type)}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group hidden={transactions.type !== TransactionType.TRANSFER}>
            <Form.Label>From Account</Form.Label>
            <Form.Select
              disabled={
                transactions.type !== TransactionType.TRANSFER || specific
              }
              value={transactions.fromAccountId}
              onChange={(e) =>
                setTransactions({
                  ...transactions,
                  fromAccountId: e.target.value,
                })
              }
            >
              {Object.values(accounts)
                .filter(
                  (account) =>
                    !(
                      settings.NO_REGULAR_BALANCE_ACCOUNTS?.value ?? ""
                    ).includes(account.id),
                )
                .map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({titleCase(account.type)})
                  </option>
                ))}
            </Form.Select>
          </Form.Group>
          {transactions.transactions.map((transaction, index) => {
            return (
              <React.Fragment key={index}>
                <Form.Group>
                  <Form.Label>Value</Form.Label>
                  <Form.Control
                    type="text"
                    isInvalid={!isValueValid(transaction.value)}
                    value={transaction.value}
                    onChange={(e) =>
                      editTransaction(index, { value: e.target.value })
                    }
                  ></Form.Control>
                </Form.Group>
                <Form.Group>
                  <Form.Label>Account</Form.Label>
                  <Form.Select
                    disabled={specific}
                    value={transaction?.accountId}
                    onChange={(e) =>
                      editTransaction(index, { accountId: e.target.value })
                    }
                  >
                    {Object.values(accounts)
                      .filter(
                        (account) =>
                          !(
                            settings.NO_REGULAR_BALANCE_ACCOUNTS?.value ?? ""
                          ).includes(account.id),
                      )
                      .map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} ({titleCase(account.type)})
                        </option>
                      ))}
                  </Form.Select>
                </Form.Group>
                <br />
                {specific ? null : (
                  <Row>
                    <Col>
                      <ButtonGroup className="float-end">
                        {index !==
                        transactions.transactions.length - 1 ? null : (
                          <Button
                            onClick={() =>
                              setTransactions({
                                ...transactions,
                                transactions: transactions.transactions.concat({
                                  accountId: defaultAccountId(
                                    settings,
                                    accounts,
                                  ),
                                }),
                              })
                            }
                          >
                            Add
                          </Button>
                        )}
                        {transactions.transactions.length === 1 ? null : (
                          <Button
                            variant="danger"
                            onClick={() => deleteTransaction(index)}
                          >
                            Delete
                          </Button>
                        )}
                      </ButtonGroup>
                    </Col>
                  </Row>
                )}
              </React.Fragment>
            )
          })}
          <br />
          <Row>
            <Col></Col>
          </Row>
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
