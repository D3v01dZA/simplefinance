package net.caltona.simplefinance.api;

import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import net.caltona.simplefinance.model.Account;
import net.caltona.simplefinance.model.AccountDAO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@AllArgsConstructor
public class AccountController {

    @Autowired
    private final AccountDAO accountDAO;

    @Transactional
    @GetMapping("/api/account/")
    public List<Account> list() {
        return accountDAO.findAll();
    }

    @Transactional
    @GetMapping("/api/account/{id}")
    public Optional<Account> get(@PathVariable String id) {
        return accountDAO.findById(id);
    }

    @Transactional
    @PostMapping("/api/account/")
    public Account create(@RequestBody Account.NewAccount newAccount) {
        return accountDAO.save(new Account(newAccount));
    }

}
