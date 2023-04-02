package net.caltona.simplefinance.api;

import lombok.*;
import net.caltona.simplefinance.model.DAccount;

@Getter
@EqualsAndHashCode
@AllArgsConstructor
public class JAccount {

    @NonNull
    private final String id;

    @NonNull
    private final String name;

    @NonNull
    private final DAccount.Type type;

    @Getter
    @EqualsAndHashCode
    @AllArgsConstructor
    public static class NewAccount {

        @NonNull
        private final String name;

        @NonNull
        private final DAccount.Type type;

        public DAccount.NewAccount dNewAccount() {
            return new DAccount.NewAccount(name, type);
        }

    }

    @Getter
    @EqualsAndHashCode
    @AllArgsConstructor
    public static class UpdateAccount {

        private final String name;

        public DAccount.UpdateAccount dUpdateAccount(String id) {
            return new DAccount.UpdateAccount(id, name);
        }

    }

}
