package net.caltona.simplefinance.api;

import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import net.caltona.simplefinance.service.Account;
import net.caltona.simplefinance.service.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@AllArgsConstructor
public class AccountController {

    @Autowired
    private final AccountService accountService;

    @Transactional
    @GetMapping("/api/account/")
    public List<JAccount> list() {
        return accountService.list().stream()
                .map(Account::json)
                .collect(Collectors.toList());
    }

    @Transactional
    @GetMapping("/api/account/{id}")
    public Optional<JAccount> get(@PathVariable String id) {
        return accountService.get(id)
                .map(Account::json);
    }

    @Transactional
    @PostMapping("/api/account/{id}")
    public Optional<JAccount> update(@PathVariable String id, @RequestBody JAccount.UpdateAccount updateAccount) {
        return accountService.update(updateAccount.updateAccount(id))
                .map(Account::json);
    }

    @Transactional
    @PostMapping("/api/account/")
    public JAccount create(@RequestBody JAccount.NewAccount newAccount) {
        return accountService.create(newAccount.newAccount())
                .json();
    }

}
