package net.caltona.simplefinance.service;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NonNull;
import net.caltona.simplefinance.api.JAccount;
import net.caltona.simplefinance.model.DAccount;

@Getter
@EqualsAndHashCode
@AllArgsConstructor
public class CheckingAccount implements Account {

    @NonNull
    private final String id;

    @NonNull
    private final String name;

    @Override
    public JAccount json() {
        return new JAccount(id, name, DAccount.Type.CHECKING);
    }
}
