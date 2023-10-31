import { Button, ButtonGroup, Col, Container, Form, Row } from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { selectAccounts } from "../app/accountSlice";
import { JSetting, SettingKey, selectSettings, setSettings } from "../app/settingSlice";
import { useEffect, useState } from "react";
import { defaultAccountId, del, err, get, post } from "../util/util";
import { AccountName } from "../util/common";
import { selectServer } from "../app/serverSlice";

export function Settings() {

    const server = useAppSelector(selectServer);
    const settings = useAppSelector(selectSettings);
    const accounts = useAppSelector(selectAccounts);

    const dispatch = useAppDispatch();

    const [updatedDefaultTransactionFromAccountId, setUpdatedDefaultTransactionFromAccountId] = useState("");
    const [updatedTransferWithoutBalanceIgnoredAccounts, setUpdatedTransferWithoutBalanceIgnoredAccounts] = useState<string[] | undefined>(undefined);
    const [selectedUpdatedDefaultTransactionFromAccountId, setSelectedUpdatedDefaultTransactionFromAccountId] = useState("");
    
    const [savingUpdatedDefaultTransactionFromAccountId, setSavingUpdatedDefaultTransactionFromAccountId] = useState(false);
    const [savingTransferWithoutBalanceIgnoredAccounts, setSavingTransferWithoutBalanceIgnoredAccounts] = useState(false);

    function refreshSettings() {
        get<JSetting[]>(server, "/api/setting/")
            .then(settings => dispatch(setSettings(settings)))
            .catch(error => err(error));
    }

    function save() {
        if (updatedDefaultTransactionFromAccountId !== "") {
            setSavingUpdatedDefaultTransactionFromAccountId(true);
            let toSave: JSetting | undefined = settings[SettingKey.DEFAULT_TRANSACTION_FROM_ACCOUNT_ID];
            if (toSave) {
                post(server, `/api/setting/${toSave.id}/`, {...toSave, value: updatedDefaultTransactionFromAccountId})
                    .then(() => refreshSettings())
                    .catch(error => err(error))
                    .finally(() => {
                        setUpdatedDefaultTransactionFromAccountId("");
                        setSavingUpdatedDefaultTransactionFromAccountId(false);
                    });
            } else {
                post(server, `/api/setting/`, {key: SettingKey.DEFAULT_TRANSACTION_FROM_ACCOUNT_ID, value: updatedDefaultTransactionFromAccountId})
                    .then(() => refreshSettings())
                    .catch(error => err(error))
                    .finally(() => {
                        setUpdatedDefaultTransactionFromAccountId("");
                        setSavingUpdatedDefaultTransactionFromAccountId(false);
                    });
            }
        }
        if (updatedTransferWithoutBalanceIgnoredAccounts !== undefined) {
            setSavingTransferWithoutBalanceIgnoredAccounts(true);
            let toSave: JSetting | undefined = settings[SettingKey.TRANSFER_WITHOUT_BALANCE_IGNORED_ACCOUNTS];
            if (toSave) {
                if (updatedTransferWithoutBalanceIgnoredAccounts.length === 0) {
                    del(server, `/api/setting/${toSave.id}/`)
                        .then(() => refreshSettings())
                        .catch(error => err(error))
                        .finally(() => {
                            setUpdatedTransferWithoutBalanceIgnoredAccounts(undefined);
                            setSavingTransferWithoutBalanceIgnoredAccounts(false);
                        });
                } else {
                    post(server, `/api/setting/${toSave.id}/`, {...toSave, value: updatedTransferWithoutBalanceIgnoredAccounts.join(",")})
                        .then(() => refreshSettings())
                        .catch(error => err(error))
                        .finally(() => {
                            setUpdatedTransferWithoutBalanceIgnoredAccounts(undefined);
                            setSavingTransferWithoutBalanceIgnoredAccounts(false);
                        });
                }
            } else {
                post(server, `/api/setting/`, {key: SettingKey.TRANSFER_WITHOUT_BALANCE_IGNORED_ACCOUNTS, value: updatedTransferWithoutBalanceIgnoredAccounts.join(",")})
                    .then(() => refreshSettings())
                    .catch(error => err(error))
                    .finally(() => {
                        setUpdatedTransferWithoutBalanceIgnoredAccounts(undefined);
                        setSavingTransferWithoutBalanceIgnoredAccounts(false);
                    });
            }
        }
    }

    function calculateIgnoredAccountIds() {
        if (updatedTransferWithoutBalanceIgnoredAccounts !== undefined) {
            return updatedTransferWithoutBalanceIgnoredAccounts;
        }
        let joinedAccounts = settings[SettingKey.TRANSFER_WITHOUT_BALANCE_IGNORED_ACCOUNTS];
        if (joinedAccounts === undefined) {
            return [];
        }
        return joinedAccounts.value.split(",");
    }

    useEffect(() => {
        setSelectedUpdatedDefaultTransactionFromAccountId(defaultAccountId(settings, accounts));
    }, [accounts, settings])

    const ignoredAccountIds = calculateIgnoredAccountIds();
    const ignoredAccountIdsElement = ignoredAccountIds.length === 0 ? <>NONE</> : ignoredAccountIds.map(accountId => <AccountName key={accountId} accounts={accounts} accountId={accountId}/>);

    return (
        <Container>
            <Row xs={1} md={1} xl={1}>
                <Col>
                    <Form.Group>
                        <Form.Label>Default Transaction From Account</Form.Label>
                        <Form.Select value={updatedDefaultTransactionFromAccountId === "" ? defaultAccountId(settings, accounts) : updatedDefaultTransactionFromAccountId} onChange={e => setUpdatedDefaultTransactionFromAccountId(e.target.value)}>
                            {Object.values(accounts).map(account => <option key={account.id} value={account.id}><AccountName accountId={account.id} accounts={accounts}/></option>)}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Transfer Without Balance Ignored Accounts: {ignoredAccountIdsElement}</Form.Label>
                        <Form.Select value={selectedUpdatedDefaultTransactionFromAccountId} onChange={e => setSelectedUpdatedDefaultTransactionFromAccountId(e.target.value)}>
                            {Object.values(accounts).map(account => <option key={account.id} value={account.id}><AccountName accountId={account.id} accounts={accounts}/></option>)}
                        </Form.Select>
                        <ButtonGroup>
                            <Button onClick={_ => {
                                if (!ignoredAccountIds.includes(selectedUpdatedDefaultTransactionFromAccountId)) {
                                    setUpdatedTransferWithoutBalanceIgnoredAccounts(ignoredAccountIds.concat(selectedUpdatedDefaultTransactionFromAccountId));
                                }
                            }}>Add</Button>
                            <Button variant="danger" onClick={_ => {
                                if (ignoredAccountIds.includes(selectedUpdatedDefaultTransactionFromAccountId)) {
                                    setUpdatedTransferWithoutBalanceIgnoredAccounts(ignoredAccountIds.filter(value => value !== selectedUpdatedDefaultTransactionFromAccountId));
                                }
                            }}>Remove</Button>
                        </ButtonGroup>
                    </Form.Group>
                </Col>
            </Row>
            <Row xs={1} md={1} xl={1}>
                <Col>
                    <ButtonGroup className="float-end">
                        <Button variant="primary" disabled={(savingUpdatedDefaultTransactionFromAccountId || updatedDefaultTransactionFromAccountId === "") && (savingTransferWithoutBalanceIgnoredAccounts || updatedTransferWithoutBalanceIgnoredAccounts === undefined)} onClick={() => save()}>
                            Save
                        </Button>
                    </ButtonGroup>
                </Col>
            </Row>
        </Container>
    );
}