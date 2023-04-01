package net.caltona.simplefinance.api;

import lombok.*;
import net.caltona.simplefinance.model.DAccount;
import net.caltona.simplefinance.service.Account;

@Getter
@EqualsAndHashCode
@AllArgsConstructor
public class JAccount {

    private final String id;

    private final String name;

    private final DAccount.Type type;

    @Getter
    @ToString
    @EqualsAndHashCode
    @AllArgsConstructor
    public static class NewAccount {

        @NonNull
        private final String name;

        @NonNull
        private final DAccount.Type type;

        public Account.NewAccount newAccount() {
            return new Account.NewAccount(name, type);
        }

    }

    @Getter
    @ToString
    @EqualsAndHashCode
    @AllArgsConstructor
    public static class UpdateAccount {

        private final String name;

        public Account.UpdateAccount updateAccount(String id) {
            return new Account.UpdateAccount(id, name);
        }

    }

}
