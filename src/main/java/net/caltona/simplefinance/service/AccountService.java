package net.caltona.simplefinance.service;

import lombok.AllArgsConstructor;
import lombok.NonNull;
import net.caltona.simplefinance.api.ExceptionControllerAdvice;
import net.caltona.simplefinance.model.DAccount;
import net.caltona.simplefinance.model.DAccountConfig;
import net.caltona.simplefinance.model.DAccountConfigDAO;
import net.caltona.simplefinance.model.DAccountDAO;
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

    public List<DAccount> list() {
       return dAccountDAO.findAll();
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
                    DAccountConfig dAccountConfig = newAccountConfig.dAccountConfig();
                    if (!account.canAddConfig(dAccountConfig)) {
                        throw new ExceptionControllerAdvice.BadConfigException("Cannot create");
                    }
                    dAccountConfig.setDAccount(dAccount);
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

}
