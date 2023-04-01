package net.caltona.simplefinance.service;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NonNull;
import net.caltona.simplefinance.model.DAccountConfig;

import java.math.BigDecimal;
import java.util.Map;

@Getter
@EqualsAndHashCode
@AllArgsConstructor
public class SavingsAccount implements Account {

    @NonNull
    private final String id;

    @NonNull
    private final String name;

    private final static String RATE = "rate";
    private final BigDecimal rate;

    public SavingsAccount(String id, String name, Map<String, Object> configs) {
        this(id, name, (BigDecimal) configs.get(RATE));
    }

    @Override
    public boolean canUpdateConfig(DAccountConfig updateAccountConfig) {
        if (!updateAccountConfig.valid()) {
            return false;
        }
        if (rate != null && updateAccountConfig.getType().equals(DAccountConfig.Type.BIG_DECIMAL) && updateAccountConfig.getName().equals(RATE)) {
            return true;
        }
        return false;
    }

    @Override
    public boolean canAddConfig(DAccountConfig newAccountConfig) {
        if (!newAccountConfig.valid()) {
            return false;
        }
        if (rate == null && newAccountConfig.getType().equals(DAccountConfig.Type.BIG_DECIMAL) && newAccountConfig.getName().equals(RATE)) {
            return true;
        }
        return false;
    }
}
