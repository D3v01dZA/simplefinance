package net.caltona.simplefinance.api;

import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.NonNull;
import net.caltona.simplefinance.api.model.JIssue;
import net.caltona.simplefinance.service.IssueService;
import net.caltona.simplefinance.service.issue.Issue;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class IssueController {

    @NonNull
    private IssueService issueService;

    @Transactional
    @GetMapping("/api/issue/")
    public List<JIssue> list() {
        return issueService.list().stream()
                .map(Issue::json)
                .collect(Collectors.toList());
    }

}
