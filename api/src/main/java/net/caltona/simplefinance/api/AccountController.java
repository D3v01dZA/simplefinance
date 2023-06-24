package net.caltona.simplefinance.api;

import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import net.caltona.simplefinance.api.model.JAccount;
import net.caltona.simplefinance.api.model.JAccountConfig;
import net.caltona.simplefinance.api.model.JBalance;
import net.caltona.simplefinance.api.model.JTransaction;
import net.caltona.simplefinance.db.model.DAccount;
import net.caltona.simplefinance.db.model.DAccountConfig;
import net.caltona.simplefinance.db.model.DTransaction;
import net.caltona.simplefinance.service.Account;
import net.caltona.simplefinance.service.AccountService;
import net.caltona.simplefinance.service.calculator.Calculator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.time.temporal.WeekFields;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class AccountController {

    @Autowired
    private final AccountService accountService;

    // ===== Summaries =====

    @Transactional
    @GetMapping("/api/net/")
    public JBalance net() {
        List<Account> accounts = accountService.list().stream()
                .map(DAccount::account)
                .toList();
        return new Calculator(accounts).calculate(LocalDate.now().plus(1, ChronoUnit.DAYS));
    }

    @Transactional
    @GetMapping("/api/monthly/")
    public List<JBalance> monthly() {
        List<Account> accounts = accountService.list().stream()
                .map(DAccount::account)
                .toList();
        LocalDate now = LocalDate.now().withDayOfMonth(1);
        LocalDate month = now.minus(12, ChronoUnit.MONTHS);
        List<LocalDate> dates = new ArrayList<>();
        while (!month.isAfter(now)) {
            dates.add(month);
            month = month.plus(1, ChronoUnit.MONTHS).withDayOfMonth(1);
        }
        dates.add(month);
        return new Calculator(accounts).calculate(dates);
    }

    @Transactional
    @GetMapping("/api/weekly/")
    public List<JBalance> weekly() {
        List<Account> accounts = accountService.list().stream()
                .map(DAccount::account)
                .toList();
        LocalDate now = LocalDate.now().with(WeekFields.of(Locale.getDefault()).dayOfWeek(), 1);
        LocalDate week = now.minus(24, ChronoUnit.WEEKS);
        List<LocalDate> dates = new ArrayList<>();
        while (!week.isAfter(now)) {
            dates.add(week);
            week = week.plus(1, ChronoUnit.WEEKS);
        }
        dates.add(week);
        return new Calculator(accounts).calculate(dates);
    }

    // ===== Queries =====



    // ===== Accounts =====

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

    // ===== Account Configs =====

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

    // ===== Transactions =====

    @Transactional
    @GetMapping("/api/transaction/")
    public List<JTransaction> listAllTransactions() {
        return accountService.listTransactions().stream()
                .map(DTransaction::json)
                .collect(Collectors.toList());
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
