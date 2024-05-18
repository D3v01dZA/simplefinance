package net.caltona.simplefinance.service;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.With;

import java.util.HashSet;
import java.util.Set;

@With
@Getter
@AllArgsConstructor
public class Validation {

    private Set<String> errors;

    public Validation() {
        this(new HashSet<>());
    }

    public Validation(String error) {
        this(Set.of(error));
    }

    public Validation withError(String error) {
        Set<String> errors = new HashSet<>(this.errors);
        return new Validation(errors);
    }

    public boolean isValid() {
        return errors.isEmpty();
    }

    public String createErrorMessage() {
        return String.join(" - ", errors);
    }

}
