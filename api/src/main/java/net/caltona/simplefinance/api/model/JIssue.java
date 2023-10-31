package net.caltona.simplefinance.api.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;
import net.caltona.simplefinance.service.issue.IssueType;

@Getter
@AllArgsConstructor
public class JIssue {

    @NonNull
    private IssueType issueType;

    private String accountId;

    private String transactionId;

    private String date;

}
