package com.qreal.wmp.auth.controllers.oauth;

import com.qreal.wmp.auth.security.utils.AuthenticatedUser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.common.util.OAuth2Utils;
import org.springframework.security.oauth2.provider.AuthorizationRequest;
import org.springframework.security.oauth2.provider.ClientDetails;
import org.springframework.security.oauth2.provider.ClientDetailsService;
import org.springframework.security.oauth2.provider.approval.Approval;
import org.springframework.security.oauth2.provider.approval.Approval.ApprovalStatus;
import org.springframework.security.oauth2.provider.approval.ApprovalStore;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.SessionAttributes;
import org.springframework.web.servlet.ModelAndView;

import java.security.Principal;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Controller for service pages of oauth flow.
 * Pages: /oauth/confirm_access (GET) (user confirming clients scopes to resources),
 * /oauth/error (GET) (error of oauth flow)
 */
@Controller
@SessionAttributes("authorizationRequest")
public class OAuthClientsController {

    private static final Logger logger = LoggerFactory.getLogger(OAuthClientsController.class);

    @Autowired
    private ClientDetailsService clientDetailsService;

    @Autowired
    private ApprovalStore approvalStore;

    @RequestMapping("/oauth/confirm_access")
    public ModelAndView getAccessConfirmation(Map<String, Object> model, Principal principal) throws Exception {
        AuthorizationRequest clientAuth = (AuthorizationRequest) model.remove("authorizationRequest");
        ClientDetails client = clientDetailsService.loadClientByClientId(clientAuth.getClientId());
        model.put("auth_request", clientAuth);
        model.put("client", client);
        Map<String, String> scopes = new LinkedHashMap<String, String>();
        for (String scope : clientAuth.getScope()) {
            scopes.put(OAuth2Utils.SCOPE_PREFIX + scope, "false");
        }
        for (Approval approval : approvalStore.getApprovals(principal.getName(), client.getClientId())) {
            if (clientAuth.getScope().contains(approval.getScope())) {
                scopes.put(OAuth2Utils.SCOPE_PREFIX + approval.getScope(),
                        approval.getStatus() == ApprovalStatus.APPROVED ? "true" : "false");
            }
        }
        model.put("scopes", scopes);
        logger.trace("User {} authorizing client {} for scopes {}", AuthenticatedUser.getAuthenticatedUserName(),
                client.getClientId(), client.getScope().toString());
        return new ModelAndView("oauth/scopesConfirmation", model);
    }

    @RequestMapping("/oauth/error")
    public ModelAndView handleError() throws Exception {
        logger.error("There was a problem with the OAuth2 protocol");
        ModelAndView modelAndView = new ModelAndView("errors/common");
        modelAndView.addObject("message", "There was a problem with the OAuth2 protocol");
        logger.error("Some problem with oauth encountered for user {}", AuthenticatedUser.getAuthenticatedUserName());
        return modelAndView;
    }
}