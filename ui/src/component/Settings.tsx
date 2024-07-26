import { Button, ButtonGroup, Col, Container, Form, Row } from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { selectAccounts } from "../app/accountSlice";
import { JSetting, SettingKey, selectSettings, setSettings } from "../app/settingSlice";
import { useEffect, useState } from "react";
import { defaultAccountId, del, err, get, post, titleCase, today } from "../util/util";
import { AccountName } from "../util/common";
import { selectServer } from "../app/serverSlice";

enum Repeat {
    DAILY = "DAILY",
    WEEKLY = "WEEKLY",
    MONTHLY = "MONTHLY",
}

interface RepeatingTransfer {
    start: string,
    repeat: Repeat,
    repeat_count: number,
    from_account_id: string,
    to_account_ids: string[]
}

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

    const [updatedRepeatingTransfers, setUpdatedRepeatingTransfers] = useState<RepeatingTransfer[]>([]);
    const [dirtyRepeatedTransfers, setDirtyRepeatedTransfers] = useState(false);
    const [savingRepeatingTransfers, setSavingRepeatingTransfers] = useState(false);

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
        if (dirtyRepeatedTransfers) {
            let toSave: JSetting | undefined = settings[SettingKey.REPEATING_TRANSFERS];
            setSavingRepeatingTransfers(true);
            if (toSave) {
                if (updatedRepeatingTransfers.length === 0) {
                    del(server, `/api/setting/${toSave.id}/`)
                        .then(() => refreshSettings())
                        .catch(error => err(error))
                        .finally(() => {
                            setSavingRepeatingTransfers(false);
                        });
                } else {
                    post(server, `/api/setting/${toSave.id}/`, { ...toSave, value: JSON.stringify(updatedRepeatingTransfers) })
                        .then(() => refreshSettings())
                        .catch(error => err(error))
                        .finally(() => {
                            setSavingRepeatingTransfers(false);
                        });
                }
            } else {
                post(server, `/api/setting/`, { key: SettingKey.REPEATING_TRANSFERS, value: JSON.stringify(updatedRepeatingTransfers) })
                    .then(() => refreshSettings())
                    .catch(error => err(error))
                    .finally(() => {
                        setSavingRepeatingTransfers(false);
                    });
            }
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

    function updateRepeatedTransfer<K extends keyof RepeatingTransfer>(index: number, key: K, value: RepeatingTransfer[K]) {
        setUpdatedRepeatingTransfers(updatedRepeatingTransfers.map((transfer, i) => {
            if (i === index) {
                return { ...transfer, [key]: value }
            } else {
                return transfer
            }
        }))
        setDirtyRepeatedTransfers(true);
    }

    useEffect(() => {
        let repeatingTransfers = settings.REPEATING_TRANSFERS;
        if (repeatingTransfers) {
            setUpdatedRepeatingTransfers(JSON.parse(repeatingTransfers.value));
        } else {
            setUpdatedRepeatingTransfers([])
        }
        setDirtyRepeatedTransfers(false);
    }, [settings])

    useEffect(() => {
        setSelectedTransferWithoutBalanceIgnoredAccounts(defaultAccountId(settings, accounts));
    }, [accounts, settings])

    useEffect(() => {
        setSelectedNoBalanceAccounts(defaultAccountId(settings, accounts));
    }, [accounts, settings])

    const transferWithoutBalanceIgnoredIds = calculateAcountIds(SettingKey.TRANSFER_WITHOUT_BALANCE_IGNORED_ACCOUNTS, updatedTransferWithoutBalanceIgnoredAccounts);
    const transferWithoutBalanceIgnoredIdsElement = transferWithoutBalanceIgnoredIds.length === 0 ? <>NONE</> : transferWithoutBalanceIgnoredIds.map(accountId => <><br /><AccountName key={accountId} accounts={accounts} accountId={accountId} /></>);

    const noBalanceAccountIds = calculateAcountIds(SettingKey.NO_REGULAR_BALANCE_ACCOUNTS, updatedNoBalanceAccounts);
    const noBalanceAccountIdsElement = noBalanceAccountIds.length === 0 ? <>NONE</> : noBalanceAccountIds.map(accountId => <><br /><AccountName key={accountId} accounts={accounts} accountId={accountId} /></>);

    console.log(updatedRepeatingTransfers)

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
                    <br />
                    <Form.Group>
                        <Form.Label>Transfer Without Balance Ignored Accounts: {transferWithoutBalanceIgnoredIdsElement}</Form.Label>
                        <Form.Select value={selectedTransferWithoutBalanceIgnoredAccounts} onChange={e => setSelectedTransferWithoutBalanceIgnoredAccounts(e.target.value)}>
                            {Object.values(accounts).map(account => <option key={account.id} value={account.id}><AccountName accountId={account.id} accounts={accounts} /></option>)}
                        </Form.Select>
                        <br />
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
                    <br />
                    <Form.Group>
                        <Form.Label>No Regular Balance Accounts: {noBalanceAccountIdsElement}</Form.Label>
                        <Form.Select value={selectedNoBalanceAccounts} onChange={e => setSelectedNoBalanceAccounts(e.target.value)}>
                            {Object.values(accounts).map(account => <option key={account.id} value={account.id}><AccountName accountId={account.id} accounts={accounts} /></option>)}
                        </Form.Select>
                        <br />
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
                    <br />
                    <Form.Label>Repeating Transfers</Form.Label>
                    {
                        updatedRepeatingTransfers.map((repeatingTransfer, index) => <Row key={index} xs={1} md={2} xl={3}>
                            <Col>
                                <Form.Group>
                                    <Form.Label>Start Date</Form.Label>
                                    <Form.Control type="date" value={repeatingTransfer.start} onChange={e => updateRepeatedTransfer(index, "start", e.target.value)}></Form.Control>
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group>
                                    <Form.Label>Repeat Type</Form.Label>
                                    <Form.Select value={repeatingTransfer.repeat} onChange={e => updateRepeatedTransfer(index, "repeat", e.target.value as Repeat)}>
                                        {Object.values(Repeat).map(repeat => <option key={repeat} value={repeat}>{titleCase(repeat)}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group>
                                    <Form.Label>Repeat</Form.Label>
                                    <Form.Control type="number" value={repeatingTransfer.repeat_count} onChange={e => updateRepeatedTransfer(index, "repeat_count", parseInt(e.target.value))}></Form.Control>
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group>
                                    <Form.Label>From Account</Form.Label>
                                    <Form.Select value={repeatingTransfer.from_account_id} onChange={e => updateRepeatedTransfer(index, "from_account_id", e.target.value)}>
                                        {Object.values(accounts).map(account => <option key={account.id} value={account.id}><AccountName accountId={account.id} accounts={accounts} /></option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group>
                                    <Form.Label>To Accounts</Form.Label>
                                    {
                                        repeatingTransfer.to_account_ids.map((accountId, toAccountIndex) => <div>
                                            <Form.Select value={accountId} onChange={e => updateRepeatedTransfer(index, "to_account_ids", repeatingTransfer.to_account_ids.map((value, i) => i === toAccountIndex ? e.target.value : value))}>
                                                {Object.values(accounts).map(account => <option key={account.id} value={account.id}><AccountName accountId={account.id} accounts={accounts} /></option>)}
                                            </Form.Select>
                                            {
                                                repeatingTransfer.to_account_ids.length === 1 ? null : <Button variant="danger" onClick={_ => {
                                                    updateRepeatedTransfer(index, "to_account_ids", repeatingTransfer.to_account_ids.filter((_, i) => toAccountIndex !== i))
                                                }}>Remove To Account</Button>
                                            }
                                        </div>)
                                    }
                                    <div>
                                        <Button variant="primary" onClick={_ => {
                                            updateRepeatedTransfer(index, "to_account_ids", repeatingTransfer.to_account_ids.concat(defaultAccountId(settings, accounts)))
                                        }}>Add To Account</Button>
                                    </div>
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group>
                                    <Form.Label>Actions</Form.Label>
                                    <div>
                                        <Button variant="danger" onClick={_ => {
                                            setUpdatedRepeatingTransfers(updatedRepeatingTransfers.filter((_, i) => i !== index));
                                            setDirtyRepeatedTransfers(true);
                                        }}>Remove Repeating Transfer</Button>
                                    </div>
                                </Form.Group>
                            </Col>
                        </Row>)
                    }
                    <div>
                        <Button variant="primary" onClick={_ => {
                            setUpdatedRepeatingTransfers(updatedRepeatingTransfers.concat({
                                start: today(),
                                repeat: Repeat.DAILY,
                                repeat_count: 1,
                                from_account_id: defaultAccountId(settings, accounts),
                                to_account_ids: [defaultAccountId(settings, accounts)]
                            }));
                            setDirtyRepeatedTransfers(true)
                        }}>Add Repeating Transfer</Button>
                    </div>
                </Col>
            </Row>
            <br />
            <Row xs={1} md={1} xl={1}>
                <Col>
                    <ButtonGroup className="float-end">
                        <Button variant="primary" disabled={(savingUpdatedDefaultTransactionFromAccountId || updatedDefaultTransactionFromAccountId === "") && (savingTransferWithoutBalanceIgnoredAccounts || updatedTransferWithoutBalanceIgnoredAccounts === undefined) && (savingNoBalanceAccounts || updatedNoBalanceAccounts === undefined) && (savingRepeatingTransfers || !dirtyRepeatedTransfers)} onClick={() => save()}>
                            Save
                        </Button>
                    </ButtonGroup>
                </Col>
            </Row>
        </Container>
    );
}