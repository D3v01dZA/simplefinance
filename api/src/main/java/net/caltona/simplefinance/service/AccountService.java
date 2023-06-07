package net.caltona.simplefinance.service;

import lombok.AllArgsConstructor;
import lombok.NonNull;
import net.caltona.simplefinance.api.ExceptionControllerAdvice;
import net.caltona.simplefinance.db.*;
import net.caltona.simplefinance.db.model.DAccount;
import net.caltona.simplefinance.db.model.DAccountConfig;
import net.caltona.simplefinance.db.model.DTransaction;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
public class AccountService {

    @NonNull
    private DAccountDAO dAccountDAO;

    @NonNull
    private DAccountConfigDAO dAccountConfigDAO;

    @NonNull
    private DTransactionDAO dTransactionDAO;

    public List<DAccount> list() {
       return dAccountDAO.findAll();
    }

    public List<DTransaction> listTransactions() {
        return dTransactionDAO.findAll();
    }

    public Optional<DAccount> get(String id) {
        return dAccountDAO.findById(id);
    }

    public Optional<DAccount> update(DAccount.UpdateAccount updateAccount) {
        return dAccountDAO.findById(updateAccount.getId())
                .map(found -> {
                    updateAccount.getName().ifPresent(found::setName);
                    dAccountDAO.save(found);
                    return found;
                });
    }

    public DAccount create(DAccount.NewAccount newAccount) {
        return dAccountDAO.save(newAccount.dAccount());
    }

    public Optional<DAccount> delete(String id) {
        return get(id)
                .map(dAccount -> {
                    dAccountDAO.delete(dAccount);
                    return dAccount;
                });
    }

    public Optional<DAccountConfig> updateAccountConfig(DAccountConfig.UpdateAccountConfig updateAccountConfig)  {
        return dAccountDAO.findById(updateAccountConfig.getAccountId())
                .map(dAccount -> {
                    Account account = dAccount.account();
                    DAccountConfig dAccountConfig = dAccount.dAccountConfig(updateAccountConfig.getId()).orElseThrow();
                    updateAccountConfig.getValue().ifPresent(dAccountConfig::setValue);
                    if (!account.canUpdateConfig(dAccountConfig)) {
                        throw new ExceptionControllerAdvice.BadConfigException("Cannot update");
                    }
                    return dAccountConfigDAO.save(dAccountConfig);
                });
    }

    public Optional<DAccountConfig> createAccountConfig(DAccountConfig.NewAccountConfig newAccountConfig) {
        return dAccountDAO.findById(newAccountConfig.getAccountId())
                .map(dAccount -> {
                    Account account = dAccount.account();
                    DAccountConfig dAccountConfig = newAccountConfig.dAccountConfig(dAccount);
                    if (!account.canAddConfig(dAccountConfig)) {
                        throw new ExceptionControllerAdvice.BadConfigException("Cannot create");
                    }
                    dAccount.addDAccountConfig(dAccountConfig);
                    dAccountDAO.save(dAccount);
                    return dAccountConfigDAO.save(dAccountConfig);
                });
    }

    public Optional<DAccountConfig> deleteAccountConfig(String accountId, String id) {
        return get(accountId)
                .flatMap(dAccount -> {
                    Optional<DAccountConfig> dAccountConfigOptional = dAccount.dAccountConfig(id);
                    if (dAccountConfigOptional.isEmpty()) {
                        return Optional.empty();
                    }
                    DAccountConfig dAccountConfig = dAccountConfigOptional.get();
                    dAccountConfigDAO.delete(dAccountConfig);
                    dAccount.removeDAccountConfig(dAccountConfig);
                    dAccountDAO.save(dAccount);
                    return Optional.of(dAccountConfig);
                });
    }

    public Optional<DTransaction> updateTransaction(DTransaction.UpdateTransaction updateTransaction)  {
        return dAccountDAO.findById(updateTransaction.getAccountId())
                .map(dAccount -> {
                    DTransaction dTransaction = dAccount.dTransaction(updateTransaction.getId()).orElseThrow();
                    updateTransaction.getDate().ifPresent(dTransaction::date);
                    updateTransaction.getValue().ifPresent(dTransaction::setValue);
                    updateTransaction.getDescription().ifPresent(dTransaction::setDescription);
                    if (!dTransaction.isValid()) {
                        throw new ExceptionControllerAdvice.BadConfigException("Invalid transaction");
                    }
                    return dTransactionDAO.save(dTransaction);
                });
    }

    public Optional<DTransaction> createTransaction(DTransaction.NewTransaction newTransaction) {
        return dAccountDAO.findById(newTransaction.getAccountId())
                .map(dAccount -> {
                    Optional<DAccount> fromAccountOptional = newTransaction.getFromAccountId().flatMap(dAccountDAO::findById);
                    DTransaction dTransaction = newTransaction.dTransaction(dAccount, fromAccountOptional.orElse(null));
                    if (!dTransaction.isValid()) {
                        throw new ExceptionControllerAdvice.BadConfigException("Invalid transaction");
                    }
                    dAccount.addDTransaction(dTransaction);
                    dAccountDAO.save(dAccount);
                    return dTransactionDAO.save(dTransaction);
                });
    }

    public Optional<DTransaction> deleteTransaction(String accountId, String id) {
        return get(accountId)
                .flatMap(dAccount -> {
                    Optional<DTransaction> dTransactionOptional = dAccount.dTransaction(id);
                    if (dTransactionOptional.isEmpty()) {
                        return Optional.empty();
                    }
                    DTransaction dTransaction = dTransactionOptional.get();
                    dTransactionDAO.delete(dTransaction);
                    dAccount.removeDTransaction(dTransaction);
                    dAccountDAO.save(dAccount);
                    return Optional.of(dTransaction);
                });
    }

}
