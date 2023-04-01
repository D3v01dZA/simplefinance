package net.caltona.simplefinance.service;

import lombok.*;
import net.caltona.simplefinance.api.JAccount;
import net.caltona.simplefinance.model.DAccount;

import java.util.Optional;

public interface Account {

    String getName();

    JAccount json();

    @Getter
    @ToString
    @EqualsAndHashCode
    @AllArgsConstructor
    class NewAccount {

        @NonNull
        private final String name;

        @NonNull
        private final DAccount.Type type;

        public DAccount databaseNewAccount() {
            return new DAccount(name, type);
        }

    }

    @Getter
    @ToString
    @EqualsAndHashCode
    @AllArgsConstructor
    class UpdateAccount {

        @NonNull
        private final String id;

        private final String name;

        public Optional<String> getName() {
            return Optional.ofNullable(name);
        }

    }

}
