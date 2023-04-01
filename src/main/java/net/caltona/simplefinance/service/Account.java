package net.caltona.simplefinance.service;

import net.caltona.simplefinance.model.DAccountConfig;

public interface Account {

    String getName();

    boolean canUpdateConfig(DAccountConfig updateAccountConfig);

    boolean canAddConfig(DAccountConfig newAccountConfig);

}
