import React from "react";
import { titleCase } from "./util";
import { IndexedAccounts } from "../app/accountSlice";

export function AccountName({ accountId: accountId, accounts }: { accountId: string, accounts: IndexedAccounts }) {
    if (accountId === undefined || accountId === null) {
        return (<React.Fragment />);
    }
    const account = accounts[accountId];
    if (account == undefined || account === null) {
        return <React.Fragment>ERROR</React.Fragment>
    }
    return (<React.Fragment>{account.name} ({titleCase(account.type)})</React.Fragment>);
}