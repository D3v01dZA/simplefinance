import { Button, ButtonGroup, Col, Container, Form, Row } from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { selectAccounts } from "../app/accountSlice";
import { JSetting, SettingKey, selectSettings, setSettings } from "../app/settingSlice";
import { useState } from "react";
import { defaultAccountId, err, get, post } from "../util/util";
import { AccountName } from "../util/common";
import { selectServer } from "../app/serverSlice";

export function Settings() {

    const server = useAppSelector(selectServer);
    const settings = useAppSelector(selectSettings);
    const accounts = useAppSelector(selectAccounts);

    const dispatch = useAppDispatch();

    const [updatedDefaultTransactionFromAccountId, setUpdatedDefaultTransactionFromAccountId] = useState("");
    
    const [savingUpdatedDefaultTransactionFromAccountId, setSavingUpdatedDefaultTransactionFromAccountId] = useState(false);

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
    }

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
                </Col>
            </Row>
            <Row xs={1} md={1} xl={1}>
                <Col>
                    <ButtonGroup className="float-end">
                        <Button variant="primary" disabled={savingUpdatedDefaultTransactionFromAccountId || updatedDefaultTransactionFromAccountId === ""} onClick={() => save()}>
                            Save
                        </Button>
                    </ButtonGroup>
                </Col>
            </Row>
        </Container>
    );
}