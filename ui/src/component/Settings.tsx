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
    const [savingUpdatedDefaultTransactionFromAccountId, setSavingUpdatedDefaultTransactionFromAccountId] = useState(false);

    const [selectedTransferWithoutBalanceIgnoredAccounts, setSelectedTransferWithoutBalanceIgnoredAccounts] = useState("");
    const [updatedTransferWithoutBalanceIgnoredAccounts, setUpdatedTransferWithoutBalanceIgnoredAccounts] = useState<string[] | undefined>(undefined);
    const [savingTransferWithoutBalanceIgnoredAccounts, setSavingTransferWithoutBalanceIgnoredAccounts] = useState(false);

    const [selectedNoBalanceAccounts, setSelectedNoBalanceAccounts] = useState("");
    const [updatedNoBalanceAccounts, setUpdatedNoBalanceAccounts] = useState<string[] | undefined>(undefined);
    const [savingNoBalanceAccounts, setSavingNoBalanceAccounts] = useState(false);

    function refreshSettings() {
        get<JSetting[]>(server, "/api/setting/")
            .then(settings => dispatch(setSettings(settings)))
            .catch(error => err(error));
    }

    function saveMultipleAccountBasedValue(settingKey: SettingKey, accounts: string[], setSaving: (value: boolean) => void) {
        setSaving(true);
        let toSave: JSetting | undefined = settings[settingKey];
        if (toSave) {
            if (accounts === undefined || accounts.length === 0) {
                del(server, `/api/setting/${toSave.id}/`)
                    .then(() => refreshSettings())
                    .catch(error => err(error))
                    .finally(() => {
                        setSaving(false);
                    });
            } else {
                post(server, `/api/setting/${toSave.id}/`, { ...toSave, value: accounts.join(",") })
                    .then(() => refreshSettings())
                    .catch(error => err(error))
                    .finally(() => {
                        setSaving(false);
                    });
            }
        } else {
            post(server, `/api/setting/`, { key: settingKey, value: accounts.join(",") })
                .then(() => refreshSettings())
                .catch(error => err(error))
                .finally(() => {
                    setSaving(false);
                });
        }
    }

    function save() {
        if (updatedDefaultTransactionFromAccountId !== "") {
            setSavingUpdatedDefaultTransactionFromAccountId(true);
            let toSave: JSetting | undefined = settings[SettingKey.DEFAULT_TRANSACTION_FROM_ACCOUNT_ID];
            if (toSave) {
                post(server, `/api/setting/${toSave.id}/`, { ...toSave, value: updatedDefaultTransactionFromAccountId })
                    .then(() => refreshSettings())
                    .catch(error => err(error))
                    .finally(() => {
                        setUpdatedDefaultTransactionFromAccountId("");
                        setSavingUpdatedDefaultTransactionFromAccountId(false);
                    });
            } else {
                post(server, `/api/setting/`, { key: SettingKey.DEFAULT_TRANSACTION_FROM_ACCOUNT_ID, value: updatedDefaultTransactionFromAccountId })
                    .then(() => refreshSettings())
                    .catch(error => err(error))
                    .finally(() => {
                        setUpdatedDefaultTransactionFromAccountId("");
                        setSavingUpdatedDefaultTransactionFromAccountId(false);
                    });
            }
        }
        if (updatedTransferWithoutBalanceIgnoredAccounts !== undefined) {
            saveMultipleAccountBasedValue(SettingKey.TRANSFER_WITHOUT_BALANCE_IGNORED_ACCOUNTS, updatedTransferWithoutBalanceIgnoredAccounts, (saving) => {
                setSavingTransferWithoutBalanceIgnoredAccounts(saving);
                if (!saving) {
                    setUpdatedTransferWithoutBalanceIgnoredAccounts(undefined);
                }
            });
        }
        if (updatedNoBalanceAccounts !== undefined) {
            saveMultipleAccountBasedValue(SettingKey.NO_REGULAR_BALANCE_ACCOUNTS, updatedNoBalanceAccounts, (saving) => {
                setSavingNoBalanceAccounts(saving);
                if (!saving) {
                    setUpdatedNoBalanceAccounts(undefined);
                }
            });
        }
    }

    function calculateAcountIds(settingKey: SettingKey, accounts: string[] | undefined) {
        if (accounts !== undefined) {
            return accounts;
        }
        let joinedAccounts = settings[settingKey];
        if (joinedAccounts === undefined) {
            return [];
        }
        return joinedAccounts.value.split(",");
    }

    useEffect(() => {
        setSelectedTransferWithoutBalanceIgnoredAccounts(defaultAccountId(settings, accounts));
    }, [accounts, settings])

    useEffect(() => {
        setSelectedNoBalanceAccounts(defaultAccountId(settings, accounts));
    }, [accounts, settings])

    const transferWithoutBalanceIgnoredIds = calculateAcountIds(SettingKey.TRANSFER_WITHOUT_BALANCE_IGNORED_ACCOUNTS, updatedTransferWithoutBalanceIgnoredAccounts);
    const transferWithoutBalanceIgnoredIdsElement = transferWithoutBalanceIgnoredIds.length === 0 ? <>NONE</> : transferWithoutBalanceIgnoredIds.map(accountId => <><br/><AccountName key={accountId} accounts={accounts} accountId={accountId} /></>);

    const noBalanceAccountIds = calculateAcountIds(SettingKey.NO_REGULAR_BALANCE_ACCOUNTS, updatedNoBalanceAccounts);
    const noBalanceAccountIdsElement = noBalanceAccountIds.length === 0 ? <>NONE</> : noBalanceAccountIds.map(accountId => <><br/><AccountName key={accountId} accounts={accounts} accountId={accountId} /></>);

    return (
        <Container>
            <Row xs={1} md={1} xl={1}>
                <Col>
                    <Form.Group>
                        <Form.Label>Default Transaction From Account</Form.Label>
                        <Form.Select value={updatedDefaultTransactionFromAccountId === "" ? defaultAccountId(settings, accounts) : updatedDefaultTransactionFromAccountId} onChange={e => setUpdatedDefaultTransactionFromAccountId(e.target.value)}>
                            {Object.values(accounts).map(account => <option key={account.id} value={account.id}><AccountName accountId={account.id} accounts={accounts} /></option>)}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Transfer Without Balance Ignored Accounts: {transferWithoutBalanceIgnoredIdsElement}</Form.Label>
                        <Form.Select value={selectedTransferWithoutBalanceIgnoredAccounts} onChange={e => setSelectedTransferWithoutBalanceIgnoredAccounts(e.target.value)}>
                            {Object.values(accounts).map(account => <option key={account.id} value={account.id}><AccountName accountId={account.id} accounts={accounts} /></option>)}
                        </Form.Select>
                        <ButtonGroup>
                            <Button onClick={_ => {
                                if (!transferWithoutBalanceIgnoredIds.includes(selectedTransferWithoutBalanceIgnoredAccounts)) {
                                    setUpdatedTransferWithoutBalanceIgnoredAccounts(transferWithoutBalanceIgnoredIds.concat(selectedTransferWithoutBalanceIgnoredAccounts));
                                }
                            }}>Add</Button>
                            <Button variant="danger" onClick={_ => {
                                if (transferWithoutBalanceIgnoredIds.includes(selectedTransferWithoutBalanceIgnoredAccounts)) {
                                    setUpdatedTransferWithoutBalanceIgnoredAccounts(transferWithoutBalanceIgnoredIds.filter(value => value !== selectedTransferWithoutBalanceIgnoredAccounts));
                                }
                            }}>Remove</Button>
                        </ButtonGroup>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>No Regular Balance Accounts: {noBalanceAccountIdsElement}</Form.Label>
                        <Form.Select value={selectedNoBalanceAccounts} onChange={e => setSelectedNoBalanceAccounts(e.target.value)}>
                            {Object.values(accounts).map(account => <option key={account.id} value={account.id}><AccountName accountId={account.id} accounts={accounts} /></option>)}
                        </Form.Select>
                        <ButtonGroup>
                            <Button onClick={_ => {
                                if (!noBalanceAccountIds.includes(selectedNoBalanceAccounts)) {
                                    setUpdatedNoBalanceAccounts(noBalanceAccountIds.concat(selectedNoBalanceAccounts));
                                }
                            }}>Add</Button>
                            <Button variant="danger" onClick={_ => {
                                if (noBalanceAccountIds.includes(selectedNoBalanceAccounts)) {
                                    setUpdatedNoBalanceAccounts(noBalanceAccountIds.filter(value => value !== selectedNoBalanceAccounts));
                                }
                            }}>Remove</Button>
                        </ButtonGroup>
                    </Form.Group>
                </Col>
            </Row>
            <Row xs={1} md={1} xl={1}>
                <Col>
                    <ButtonGroup className="float-end">
                        <Button variant="primary" disabled={(savingUpdatedDefaultTransactionFromAccountId || updatedDefaultTransactionFromAccountId === "") && (savingTransferWithoutBalanceIgnoredAccounts || updatedTransferWithoutBalanceIgnoredAccounts === undefined) && (savingNoBalanceAccounts || updatedNoBalanceAccounts === undefined)} onClick={() => save()}>
                            Save
                        </Button>
                    </ButtonGroup>
                </Col>
            </Row>
        </Container>
    );
}