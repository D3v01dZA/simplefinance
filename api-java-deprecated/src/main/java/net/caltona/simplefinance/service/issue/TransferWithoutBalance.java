package net.caltona.simplefinance.service.issue;

import lombok.AllArgsConstructor;
import lombok.NonNull;
import net.caltona.simplefinance.api.model.JIssue;

@AllArgsConstructor
public class TransferWithoutBalance implements Issue {

    @NonNull
    private String accountId;

    @NonNull
    private String transactionId;

    @NonNull
    private String date;

    @Override
    public JIssue json() {
        return new JIssue(IssueType.TRANSFER_WITHOUT_BALANCE, accountId, transactionId, date);
    }
}
