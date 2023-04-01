package net.caltona.simplefinance.service;

import lombok.AllArgsConstructor;
import net.caltona.simplefinance.model.DAccount;
import net.caltona.simplefinance.model.DAccountDAO;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class AccountService {

    private DAccountDAO dAccountDAO;

    public List<Account> list() {
       return dAccountDAO.findAll().stream()
               .map(DAccount::account)
               .collect(Collectors.toList());
    }

    public Optional<Account> get(String id) {
        return dAccountDAO.findById(id)
                .map(DAccount::account);
    }

    public Optional<Account> update(Account.UpdateAccount updateAccount) {
        return dAccountDAO.findById(updateAccount.getId())
                .map(found -> {
                    updateAccount.getName().ifPresent(found::setName);
                    dAccountDAO.save(found);
                    return found;
                })
                .map(DAccount::account);
    }

    public Account create(Account.NewAccount newAccount) {
        return dAccountDAO.save(newAccount.databaseNewAccount())
                .account();
    }

}
