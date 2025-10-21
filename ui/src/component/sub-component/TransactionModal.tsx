import { IndexedAccounts } from "../../app/accountSlice"
import { IndexedSettings } from "../../app/settingSlice"
import { defaultAccountId, isValueValid, titleCase } from "../../util/util"
import { TransactionType } from "../Transactions"
import { Button, Form, Modal } from "react-bootstrap"

export interface WorkingTransaction {
  id: string
  description: string
  date: string
  value: string
  type: TransactionType
  accountId: string
  fromAccountId: string
}

export function TransactionModal({
  accounts,
  settings,
  singleAccount,
  singleType,
  singleDate,
  show,
  setShow,
  transaction,
  setTransaction,
  saving,
  save,
}: {
  accounts: IndexedAccounts
  settings: IndexedSettings
  singleAccount: boolean
  singleType: boolean
  singleDate: boolean
  show: boolean
  setShow: (value: boolean) => void
  transaction: Partial<WorkingTransaction>
  setTransaction: (transaction: Partial<WorkingTransaction>) => void
  saving: boolean
  save: () => void
}) {
  const isAdd = transaction.id === undefined
  return (
    <Modal show={show} onHide={() => setShow(false)}>
      <Modal.Header closeButton>
        <Modal.Title>{isAdd ? "Add" : "Edit"} Transaction</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Label>Description</Form.Label>
            <Form.Control
              type="text"
              value={transaction?.description}
              onChange={(e) =>
                setTransaction({ ...transaction, description: e.target.value })
              }
            ></Form.Control>
          </Form.Group>
          <Form.Group>
            <Form.Label>Date</Form.Label>
            <Form.Control
              type="date"
              value={transaction?.date}
              disabled={singleDate}
              onChange={(e) =>
                setTransaction({ ...transaction, date: e.target.value })
              }
            ></Form.Control>
          </Form.Group>
          <Form.Group>
            <Form.Label>Value</Form.Label>
            <Form.Control
              type="text"
              isInvalid={!isValueValid(transaction?.value)}
              value={transaction?.value}
              onChange={(e) =>
                setTransaction({ ...transaction, value: e.target.value })
              }
            ></Form.Control>
          </Form.Group>
          <Form.Group>
            <Form.Label>Type</Form.Label>
            <Form.Select
              disabled={!isAdd || singleType}
              value={transaction.type}
              onChange={(e) => {
                const type = e.target.value as TransactionType
                const fromAccountId =
                  type === TransactionType.TRANSFER
                    ? defaultAccountId(settings, accounts)
                    : undefined
                setTransaction({ ...transaction, fromAccountId, type })
              }}
            >
              {Object.keys(TransactionType).map((type) => (
                <option key={type} value={type}>
                  {titleCase(type)}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group>
            <Form.Label>Account</Form.Label>
            <Form.Select
              disabled={!isAdd || singleAccount}
              value={transaction?.accountId}
              onChange={(e) =>
                setTransaction({ ...transaction, accountId: e.target.value })
              }
            >
              {Object.values(accounts).map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({titleCase(account.type)})
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group hidden={transaction.type !== TransactionType.TRANSFER}>
            <Form.Label>From Account</Form.Label>
            <Form.Select
              disabled={!isAdd || transaction.type !== TransactionType.TRANSFER}
              value={transaction?.fromAccountId}
              onChange={(e) =>
                setTransaction({
                  ...transaction,
                  fromAccountId: e.target.value,
                })
              }
            >
              {Object.values(accounts).map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({titleCase(account.type)})
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
