package net.caltona.simplefinance;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.caltona.simplefinance.api.JAccount;
import net.caltona.simplefinance.api.JAccountConfig;
import net.caltona.simplefinance.model.DAccount;
import net.caltona.simplefinance.model.DAccountConfig;
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

        // Delete some config
        JAccountConfig deletedRateConfig = deleteAccountConfig(persistentAccount.getId(), rateConfig.getId());
        Assertions.assertEquals(rateConfig, deletedRateConfig);
        List<JAccountConfig> deletedAccountConfig = listAccountConfigs(persistentAccount.getId());
        Assertions.assertEquals(List.of(), deletedAccountConfig);
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

}
