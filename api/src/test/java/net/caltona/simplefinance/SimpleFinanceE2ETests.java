package net.caltona.simplefinance;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.caltona.simplefinance.api.model.JAccount;
import net.caltona.simplefinance.api.model.JAccountConfig;
import net.caltona.simplefinance.api.model.JTransaction;
import net.caltona.simplefinance.db.model.DAccount;
import net.caltona.simplefinance.db.model.DAccountConfig;
import net.caltona.simplefinance.db.model.DTransaction;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

@SpringBootTest
@AutoConfigureMockMvc
@ExtendWith(SpringExtension.class)
@TestPropertySource("classpath:test-application.properties")
class SimpleFinanceE2ETests {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void test() throws Exception {
        // Create two accounts
        JAccount initialAccount = createAccount("Account", DAccount.Type.CHECKING);
        JAccount updatedAccount = updateAccount(initialAccount.getId(), new JAccount.UpdateAccount("Test"));
        JAccount persistentAccount = createAccount("AccountTwo", DAccount.Type.SAVINGS);
        List<JAccount> bothAccounts = listAccounts();
        Assertions.assertEquals(List.of(updatedAccount, persistentAccount), bothAccounts);

        // Delete one account
        JAccount deleted = deleteAccount(updatedAccount.getId());
        Assertions.assertEquals(updatedAccount, deleted);
        Optional<JAccount> deletedOptional = getAccount(updatedAccount.getId());
        Assertions.assertFalse(deletedOptional.isPresent());
        List<JAccount> oneAccount = listAccounts();
        Assertions.assertEquals(List.of(persistentAccount), oneAccount);

        // Add some config
        JAccountConfig rateConfig = createAccountConfig(persistentAccount.getId(), "rate", DAccountConfig.Type.BIG_DECIMAL, "12");
        List<JAccountConfig> accountConfigs = listAccountConfigs(persistentAccount.getId());
        Assertions.assertEquals(List.of(rateConfig), accountConfigs);

        // Update some config
        JAccountConfig updateConfig = updateAccountConfig(persistentAccount.getId(), rateConfig.getId(), new JAccountConfig.UpdateAccountConfig("13"));
        List<JAccountConfig> updatedConfigs = listAccountConfigs(persistentAccount.getId());
        Assertions.assertEquals(List.of(updateConfig), updatedConfigs);

        // Delete some config
        JAccountConfig deletedRateConfig = deleteAccountConfig(persistentAccount.getId(), updateConfig.getId());
        Assertions.assertEquals(updateConfig, deletedRateConfig);
        List<JAccountConfig> deletedAccountConfig = listAccountConfigs(persistentAccount.getId());
        Assertions.assertEquals(List.of(), deletedAccountConfig);

        // Add some transaction
        JTransaction transaction = createTransaction(persistentAccount.getId(), "start", LocalDate.now(), BigDecimal.valueOf(10), DTransaction.Type.BALANCE, null);
        List<JTransaction> transactions = listTransactions(persistentAccount.getId());
        Assertions.assertEquals(List.of(transaction), transactions);

        // Update some transaction
        JTransaction updatedTransaction = updateTransaction(persistentAccount.getId(), transaction.getId(), new JTransaction.UpdateTransaction("test", Instant.now(), BigDecimal.valueOf(100)));
        List<JTransaction> updatedTransactions = listTransactions(persistentAccount.getId());
        Assertions.assertEquals(List.of(updatedTransaction), updatedTransactions);

        // Delete some config
        JTransaction deletedTransaction = deleteTransaction(persistentAccount.getId(), updatedTransaction.getId());
        Assertions.assertEquals(updatedTransaction, deletedTransaction);
        List<JTransaction> deletedTransactions = listTransactions(persistentAccount.getId());
        Assertions.assertEquals(List.of(), deletedTransactions);
    }

    private JAccount createAccount(String name, DAccount.Type type) throws Exception {
        MockHttpServletResponse response = mvc.perform(post("/api/account/")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new JAccount.NewAccount(name, type))))
                .andReturn()
                .getResponse();
        Assertions.assertEquals(200, response.getStatus());
        JAccount expected = objectMapper.readValue(response.getContentAsByteArray(), JAccount.class);
        JAccount fetched = getAccount(expected.getId()).get();
        Assertions.assertEquals(expected, fetched);
        return fetched;
    }

    private JAccount updateAccount(String id, JAccount.UpdateAccount updateAccount) throws Exception {
        MockHttpServletResponse response = mvc.perform(post("/api/account/" + id + "/")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(updateAccount)))
                .andReturn()
                .getResponse();
        Assertions.assertEquals(200, response.getStatus());
        JAccount expected = objectMapper.readValue(response.getContentAsByteArray(), JAccount.class);
        JAccount fetched = getAccount(expected.getId()).get();
        Assertions.assertEquals(expected, fetched);
        return fetched;
    }

    private JAccount deleteAccount(String id) throws Exception {
        MockHttpServletResponse response = mvc.perform(delete("/api/account/" + id + "/")
                        .contentType(MediaType.APPLICATION_JSON))
                .andReturn()
                .getResponse();
        return objectMapper.readValue(response.getContentAsByteArray(), JAccount.class);
    }

    private JAccountConfig deleteAccountConfig(String accountId, String id) throws Exception {
        MockHttpServletResponse response = mvc.perform(delete("/api/account/" + accountId + "/config/" + id + "/")
                        .contentType(MediaType.APPLICATION_JSON))
                .andReturn()
                .getResponse();
        return objectMapper.readValue(response.getContentAsByteArray(), JAccountConfig.class);
    }

    private JAccountConfig updateAccountConfig(String accountId, String id, JAccountConfig.UpdateAccountConfig updateAccountConfig) throws Exception {
        MockHttpServletResponse response = mvc.perform(post("/api/account/" + accountId + "/config/" + id + "/")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(updateAccountConfig)))
                .andReturn()
                .getResponse();
        Assertions.assertEquals(200, response.getStatus());
        JAccountConfig expected = objectMapper.readValue(response.getContentAsByteArray(), JAccountConfig.class);
        JAccountConfig fetched = getAccountConfig(accountId, expected.getId()).get();
        Assertions.assertEquals(expected, fetched);
        return fetched;
    }

    private JTransaction deleteTransaction(String accountId, String id) throws Exception {
        MockHttpServletResponse response = mvc.perform(delete("/api/account/" + accountId + "/transaction/" + id + "/")
                        .contentType(MediaType.APPLICATION_JSON))
                .andReturn()
                .getResponse();
        return objectMapper.readValue(response.getContentAsByteArray(), JTransaction.class);
    }

    private JAccountConfig createAccountConfig(String accountId, String name, DAccountConfig.Type type, String value) throws Exception {
        MockHttpServletResponse response = mvc.perform(post("/api/account/" + accountId + "/config/")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new JAccountConfig.NewAccountConfig(name, type, value))))
                .andReturn()
                .getResponse();
        Assertions.assertEquals(200, response.getStatus());
        JAccountConfig expected = objectMapper.readValue(response.getContentAsByteArray(), JAccountConfig.class);
        JAccountConfig fetched = getAccountConfig(accountId, expected.getId()).get();
        Assertions.assertEquals(expected, fetched);
        return fetched;
    }

    private JTransaction createTransaction(String accountId, String description, LocalDate date, BigDecimal value, DTransaction.Type type, String fromAccountId) throws Exception {
        MockHttpServletResponse response = mvc.perform(post("/api/account/" + accountId + "/transaction/")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new JTransaction.NewTransaction(description, date, value, type, fromAccountId))))
                .andReturn()
                .getResponse();
        Assertions.assertEquals(200, response.getStatus());
        JTransaction expected = objectMapper.readValue(response.getContentAsByteArray(), JTransaction.class);
        JTransaction fetched = getTransaction(accountId, expected.getId()).get();
        Assertions.assertEquals(expected, fetched);
        return fetched;
    }

    private JTransaction updateTransaction(String accountId, String id, JTransaction.UpdateTransaction updateTransaction) throws Exception {
        MockHttpServletResponse response = mvc.perform(post("/api/account/" + accountId + "/transaction/" + id + "/")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(updateTransaction)))
                .andReturn()
                .getResponse();
        Assertions.assertEquals(200, response.getStatus());
        JTransaction expected = objectMapper.readValue(response.getContentAsByteArray(), JTransaction.class);
        JTransaction fetched = getTransaction(accountId, expected.getId()).get();
        Assertions.assertEquals(expected, fetched);
        return fetched;
    }

    private List<JAccount> listAccounts() throws Exception {
        MockHttpServletResponse response = mvc.perform(get("/api/account/").contentType(MediaType.APPLICATION_JSON))
                .andReturn()
                .getResponse();
        Assertions.assertEquals(200, response.getStatus());
        return objectMapper.readValue(response.getContentAsByteArray(), new TypeReference<List<JAccount>>() {});
    }

    private List<JAccountConfig> listAccountConfigs(String accountId) throws Exception {
        MockHttpServletResponse response = mvc.perform(get("/api/account/" + accountId + "/config/").contentType(MediaType.APPLICATION_JSON))
                .andReturn()
                .getResponse();
        Assertions.assertEquals(200, response.getStatus());
        return objectMapper.readValue(response.getContentAsByteArray(), new TypeReference<List<JAccountConfig>>() {});
    }

    private List<JTransaction> listTransactions(String accountId) throws Exception {
        MockHttpServletResponse response = mvc.perform(get("/api/account/" + accountId + "/transaction/").contentType(MediaType.APPLICATION_JSON))
                .andReturn()
                .getResponse();
        Assertions.assertEquals(200, response.getStatus());
        return objectMapper.readValue(response.getContentAsByteArray(), new TypeReference<List<JTransaction>>() {});
    }

    private Optional<JAccount> getAccount(String id) throws Exception {
        MockHttpServletResponse response = mvc.perform(get("/api/account/" + id + "/").contentType(MediaType.APPLICATION_JSON))
                .andReturn()
                .getResponse();
        if (response.getStatus() == 200) {
            return Optional.of(objectMapper.readValue(response.getContentAsByteArray(), JAccount.class));
        }
        return Optional.empty();
    }

    private Optional<JAccountConfig> getAccountConfig(String accountId, String id) throws Exception {
        MockHttpServletResponse response = mvc.perform(get("/api/account/" + accountId + "/config/" + id + "/").contentType(MediaType.APPLICATION_JSON))
                .andReturn()
                .getResponse();
        if (response.getStatus() == 200) {
            return Optional.of(objectMapper.readValue(response.getContentAsByteArray(), JAccountConfig.class));
        }
        return Optional.empty();
    }

    private Optional<JTransaction> getTransaction(String accountId, String id) throws Exception {
        MockHttpServletResponse response = mvc.perform(get("/api/account/" + accountId + "/transaction/" + id + "/").contentType(MediaType.APPLICATION_JSON))
                .andReturn()
                .getResponse();
        if (response.getStatus() == 200) {
            return Optional.of(objectMapper.readValue(response.getContentAsByteArray(), JTransaction.class));
        }
        return Optional.empty();
    }

}
