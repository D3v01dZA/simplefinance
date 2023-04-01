package net.caltona.simplefinance.service;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NonNull;
import net.caltona.simplefinance.model.DAccountConfig;

import java.util.Map;

@Getter
@EqualsAndHashCode
@AllArgsConstructor
public class CheckingAccount implements Account {

    @NonNull
    private final String id;

    @NonNull
    private final String name;

    public CheckingAccount(String id, String name, Map<String, Object> configs) {
        this(id, name);
    }

    @Override
    public boolean canUpdateConfig(DAccountConfig updateAccountConfig) {
        return false;
    }

    @Override
    public boolean canAddConfig(DAccountConfig newAccountConfig) {
        return false;
    }
}
