import { Button, Form, Modal } from "react-bootstrap";
import { AccountType, IndexedAccounts } from "../../app/accountSlice";
import { IndexedSettings } from "../../app/settingSlice";
import { filterTransactions, formattedAmount, isValueValid } from "../../util/util";
import { JTranscation, TransactionType } from "../Transactions";
import { AccountName } from "../../util/common";

export interface BalanceAddingTranscations {
    [accountId: string]: string
}

export function BalanceTransactionModal({
    accounts,
    settings,
    specificAccounts,
    show,
    setShow,
    date,
    setDate,
    transactions,
    balanceAddingTransactions,
    setBalanceAddingTransactions,
    saving,
    save
}: {
    accounts: IndexedAccounts,
    settings: IndexedSettings,
    specificAccounts?: string[],
    show: boolean,
    setShow: (value: boolean) => void,
    date: string,
    setDate: (value: string) => void,
    transactions: JTranscation[],
    balanceAddingTransactions: BalanceAddingTranscations,
    setBalanceAddingTransactions: (value: BalanceAddingTranscations) => void,
    saving: boolean,
    save: () => void
}) {
    let actualDate = new Date(date);
    const mappedTransactions = filterTransactions(transactions, TransactionType.BALANCE, transaction => new Date(transaction.date) <= actualDate).reduce<{ [accountId: string]: JTranscation }>((acc, current) => {
        acc[current.accountId] = current;
        return acc;
    }, {});

    function editTransaction(accountId: string, value: string) {
        if (value === undefined || value === "") {
            const copy = { ...balanceAddingTransactions }
            delete copy[accountId];
            setBalanceAddingTransactions(copy);
        } else {
            setBalanceAddingTransactions({
                ...balanceAddingTransactions,
                [accountId]: value
            });
        }
    }

    function placeholder(accountId: string) {
        let transaction = mappedTransactions[accountId];
        if (!transaction || transaction.date === date) {
            return undefined;
        }
        return formattedAmount(transaction.value) + "";
    }

    function value(accountId: string): string {
        let transaction = mappedTransactions[accountId];
        if (!transaction || transaction.date !== date) {
            return balanceAddingTransactions[accountId] ?? "";
        }
        return transaction.value + "";
    }

    function disabled(accountId: string) {
        let transaction = mappedTransactions[accountId];
        if (!transaction || transaction.date !== date) {
            return false;
        }
        return true;
    }

    return (
        <Modal show={show} onHide={() => setShow(false)} >
            <Modal.Header closeButton>
                <Modal.Title>Add Multiple Balance Transactions</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form.Group>
                    <Form.Label>Date</Form.Label>
                    <Form.Control type="date" disabled={false} value={date} onChange={e => setDate(e.target.value)}></Form.Control>
                </Form.Group>
                {
                    Object.values(accounts)
                        .filter(account => account.type !== AccountType.EXTERNAL)
                        .map(account => account.id)
                        .filter(id => {
                            if (specificAccounts === undefined) {
                                return !(settings.NO_REGULAR_BALANCE_ACCOUNTS?.value ?? "").includes(id);
                            } else {
                                return specificAccounts.includes(id);
                            }
                        })
                        .map(id => {
                            return (
                                <Form.Group key={id}>
                                    <Form.Label><AccountName accountId={id} accounts={accounts} /></Form.Label>
                                    <Form.Control type="text" className="colored-placeholder" value={value(id)} placeholder={placeholder(id)} disabled={disabled(id)} isInvalid={value(id) !== "" && !isValueValid(value(id))} onChange={e => editTransaction(id, e.target.value)}></Form.Control>
                                </Form.Group>
                            )
                        })
                }
            </Modal.Body>
            <Modal.Footer>
                <Button disabled={saving} variant="secondary" onClick={() => setShow(false)}>
                    Cancel
                </Button>
                <Button disabled={saving} variant="primary" onClick={() => save()}>
                    Save
                </Button>
            </Modal.Footer>
        </Modal>
    );
}