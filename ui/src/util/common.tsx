import React from "react";
import { accountTitle, titleCase } from "./util";
import { IndexedAccounts } from "../app/accountSlice";

export function AccountName({ accountId: accountId, accounts }: { accountId: string, accounts: IndexedAccounts }) {
    return (<React.Fragment>{accountTitle(accountId, accounts)}</React.Fragment>);
}