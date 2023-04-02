package net.caltona.simplefinance.api;

import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import net.caltona.simplefinance.model.DAccount;
import net.caltona.simplefinance.model.DAccountConfig;
import net.caltona.simplefinance.model.DTransaction;
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
                .map(DAccount::json)
                .collect(Collectors.toList());
    }

    @Transactional
    @GetMapping("/api/account/{id}/")
    public Optional<JAccount> get(@PathVariable String id) {
        return accountService.get(id)
                .map(DAccount::json);
    }

    @Transactional
    @PostMapping("/api/account/{id}/")
    public Optional<JAccount> update(@PathVariable String id, @RequestBody JAccount.UpdateAccount updateAccount) {
        return accountService.update(updateAccount.dUpdateAccount(id))
                .map(DAccount::json);
    }

    @Transactional
    @PostMapping("/api/account/")
    public JAccount create(@RequestBody JAccount.NewAccount newAccount) {
        return accountService.create(newAccount.dNewAccount())
                .json();
    }

    @Transactional
    @DeleteMapping("/api/account/{id}/")
    public Optional<JAccount> delete(@PathVariable String id) {
        return accountService.delete(id)
                .map(DAccount::json);
    }

    @Transactional
    @GetMapping("/api/account/{id}/config/")
    public Optional<List<JAccountConfig>> listConfig(@PathVariable String id) {
        return accountService.get(id)
                .map(DAccount::getDAccountConfigs)
                .map(dAccountConfigs -> dAccountConfigs.stream()
                        .map(DAccountConfig::json)
                        .collect(Collectors.toList())
                );
    }

    @Transactional
    @GetMapping("/api/account/{id}/config/{configId}/")
    public Optional<JAccountConfig> getConfig(@PathVariable String id, @PathVariable String configId) {
        return accountService.get(id)
                .flatMap(account -> account.dAccountConfig(configId))
                .map(DAccountConfig::json);
    }

    @Transactional
    @PostMapping("/api/account/{id}/config/{configId}/")
    public Optional<JAccountConfig> updateConfig(@PathVariable String id, @PathVariable String configId, @RequestBody JAccountConfig.UpdateAccountConfig updateAccountConfig) {
        return accountService.updateAccountConfig(updateAccountConfig.dUpdateAccountConfig(id, configId))
                .map(DAccountConfig::json);
    }

    @Transactional
    @PostMapping("/api/account/{id}/config/")
    public Optional<JAccountConfig> createConfig(@PathVariable String id, @RequestBody JAccountConfig.NewAccountConfig newAccountConfig) {
        return accountService.createAccountConfig(newAccountConfig.dNewAccountConfig(id))
                .map(DAccountConfig::json);
    }

    @Transactional
    @DeleteMapping("/api/account/{id}/config/{configId}/")
    public Optional<JAccountConfig> deleteConfig(@PathVariable String id, @PathVariable String configId) {
        return accountService.deleteAccountConfig(id, configId)
                .map(DAccountConfig::json);
    }

    @Transactional
    @GetMapping("/api/account/{id}/transaction/")
    public Optional<List<JTransaction>> listTransaction(@PathVariable String id) {
        return accountService.get(id)
                .map(DAccount::getDTransactions)
                .map(dAccountConfigs -> dAccountConfigs.stream()
                        .map(DTransaction::json)
                        .collect(Collectors.toList())
                );
    }

    @Transactional
    @GetMapping("/api/account/{id}/transaction/{transactionId}/")
    public Optional<JTransaction> getTransaction(@PathVariable String id, @PathVariable String transactionId) {
        return accountService.get(id)
                .flatMap(account -> account.dTransaction(transactionId))
                .map(DTransaction::json);
    }

    @Transactional
    @PostMapping("/api/account/{id}/transaction/{transactionId}/")
    public Optional<JTransaction> updateTransaction(@PathVariable String id, @PathVariable String transactionId, @RequestBody JTransaction.UpdateTransaction updateTransaction) {
        return accountService.updateTransaction(updateTransaction.dUpdateTransaction(id, transactionId))
                .map(DTransaction::json);
    }

    @Transactional
    @PostMapping("/api/account/{id}/transaction/")
    public Optional<JTransaction> createTransaction(@PathVariable String id, @RequestBody JTransaction.NewTransaction newTransaction) {
        return accountService.createTransaction(newTransaction.dNewTransaction(id))
                .map(DTransaction::json);
    }

    @Transactional
    @DeleteMapping("/api/account/{id}/transaction/{transactionId}/")
    public Optional<JTransaction> deleteTransaction(@PathVariable String id, @PathVariable String transactionId) {
        return accountService.deleteTransaction(id, transactionId)
                .map(DTransaction::json);
    }

}
