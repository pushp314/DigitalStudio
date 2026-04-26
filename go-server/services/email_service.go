package services

import (
	"fmt"
	"log"
	"net/smtp"

	"github.com/pushp314/bizcode/go-server/config"
)

type EmailService interface {
	SendEmail(to []string, subject, body string) error
	SendOrderConfirmation(email string, orderID uint, total float64) error
	SendLicenseDelivery(email string, orderID uint, licenses []string) error
	SendWelcomeEmail(email string, name string) error
	SendCombinedOrderFulfillment(email string, orderID uint, total float64, licenses []string) error
	SendSupportReply(email string, subject string, message string) error
	SendCartRecovery(email string, stage int, cartTotal float64) error
}

type emailService struct {
	config config.Config
}

func NewEmailService(cfg config.Config) EmailService {
	return &emailService{config: cfg}
}

func (s *emailService) wrapHTML(content string) string {
	return fmt.Sprintf(`
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; }
				.container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
				.header { margin-bottom: 30px; }
				.logo { font-size: 24px; font-weight: 800; color: #000; text-decoration: none; }
				.content { background: #ffffff; border: 1px solid #e5e5e5; border-radius: 12px; padding: 30px; }
				.footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
				.button { display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
				code { background: #f4f4f4; padding: 4px 8px; border-radius: 4px; font-family: monospace; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<a href="%s" class="logo">BizCode</a>
				</div>
				<div class="content">
					%s
				</div>
				<div class="footer">
					&copy; 2026 BizCode Marketplace. All rights reserved.
				</div>
			</div>
		</body>
		</html>
	`, s.config.FrontendURL, content)
}

func (s *emailService) SendEmail(to []string, subject, body string) error {
	if s.config.EmailProvider == "stdout" {
		log.Printf("[Email-STDOUT] To: %v, Subject: %s\nBody: %s", to, subject, body)
		return nil
	}

	if s.config.EmailProvider == "smtp" {
		auth := smtp.PlainAuth("", s.config.SMTPUser, s.config.SMTPPass, s.config.SMTPHost)
		msg := []byte(fmt.Sprintf("To: %v\r\nSubject: %s\r\nMIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n%s\r\n", to, subject, body))
		addr := fmt.Sprintf("%s:%s", s.config.SMTPHost, s.config.SMTPPort)
		return smtp.SendMail(addr, auth, s.config.EmailFrom, to, msg)
	}

	return fmt.Errorf("unsupported email provider: %s", s.config.EmailProvider)
}

func (s *emailService) SendOrderConfirmation(email string, orderID uint, total float64) error {
	subject := fmt.Sprintf("Order Confirmation #%d - BizCode", orderID)
	content := fmt.Sprintf(`
		<h1 style="margin-top: 0;">Thank you for your purchase!</h1>
		<p>Your order <strong>#%d</strong> has been successfully processed and settled.</p>
		<p style="font-size: 18px; font-weight: bold;">Total Paid: ₹%.2f</p>
		<p>You can access your products and technical assets in your dashboard immediately.</p>
		<a href="%s/profile" class="button">Access My Assets</a>
	`, orderID, total, s.config.FrontendURL)
	return s.SendEmail([]string{email}, subject, s.wrapHTML(content))
}

func (s *emailService) SendCombinedOrderFulfillment(email string, orderID uint, total float64, licenses []string) error {
	subject := fmt.Sprintf("Order Confirmation & Asset Keys #%d - BizCode", orderID)
	keysHTML := ""
	if len(licenses) > 0 {
		keysHTML = "<div style='margin: 20px 0; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;'>"
		for _, l := range licenses {
			keysHTML += fmt.Sprintf("<div style='margin-bottom: 10px;'><code>%s</code></div>", l)
		}
		keysHTML += "</div>"
	}
	content := fmt.Sprintf(`
		<h1 style="margin-top: 0;">Thank you for your purchase!</h1>
		<p>Your order <strong>#%d</strong> has been successfully processed and settled.</p>
		<p style="font-size: 18px; font-weight: bold;">Total Paid: ₹%.2f</p>
		%s
		<p>You can access your products and technical assets in your dashboard immediately.</p>
		<a href="%s/profile" class="button">Access My Assets</a>
	`, orderID, total, keysHTML, s.config.FrontendURL)
	return s.SendEmail([]string{email}, subject, s.wrapHTML(content))
}

func (s *emailService) SendLicenseDelivery(email string, orderID uint, licenses []string) error {
	subject := "Your Product Licenses - BizCode"
	keysHTML := ""
	for _, l := range licenses {
		keysHTML += fmt.Sprintf("<div style='margin-bottom: 10px;'><code>%s</code></div>", l)
	}
	content := fmt.Sprintf(`
		<h1 style="margin-top: 0;">Your Licenses are Ready!</h1>
		<p>Here are your license keys for Order #%d:</p>
		<div style="background: #fafafa; padding: 20px; border-radius: 8px; margin: 20px 0;">
			%s
		</div>
		<p>Keep these keys safe. You can manage your activations in your profile settings.</p>
		<a href="%s/profile?tab=licenses" class="button">Manage Activations</a>
	`, orderID, keysHTML, s.config.FrontendURL)
	return s.SendEmail([]string{email}, subject, s.wrapHTML(content))
}

func (s *emailService) SendWelcomeEmail(email string, name string) error {
	subject := "Welcome to BizCode"
	content := fmt.Sprintf(`
		<h1 style="margin-top: 0;">Welcome, %s!</h1>
		<p>We're thrilled to have you join our developer community.</p>
		<p>BizCode is your headquarters for high-quality software templates, full-stack components, and expert technical support.</p>
		<p>Start exploring our latest inventory today!</p>
		<a href="%s/templates" class="button">Browse Templates</a>
	`, name, s.config.FrontendURL)
	return s.SendEmail([]string{email}, subject, s.wrapHTML(content))
}

func (s *emailService) SendSupportReply(email string, originalSubject string, message string) error {
	subject := "RE: " + originalSubject
	content := fmt.Sprintf(`
		<h1 style="margin-top: 0;">Support Update</h1>
		<p>You have received a new reply regarding your inquiry.</p>
		<div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #000;">
			%s
		</div>
		<p>You can reply directly to this email or visit your support dashboard.</p>
		<a href="%s/profile?tab=messages" class="button">View Conversation</a>
	`, message, s.config.FrontendURL)
	return s.SendEmail([]string{email}, subject, s.wrapHTML(content))
}

func (s *emailService) SendCartRecovery(email string, stage int, cartTotal float64) error {
	subject := "You left something in your cart!"
	if stage >= 2 {
		subject = "Special Offer: Complete your purchase"
	}

	content := fmt.Sprintf(`
		<h1 style="margin-top: 0;">Don't miss out!</h1>
		<p>We noticed you left some premium assets in your cart totaling ₹%.2f.</p>
		<p>Complete your purchase now to get immediate access to your developer assets and documentation.</p>
		<a href="%s/checkout" class="button">Resume Checkout</a>
	`, cartTotal, s.config.FrontendURL)

	return s.SendEmail([]string{email}, subject, s.wrapHTML(content))
}

type noopEmailService struct{}

func (noopEmailService) SendEmail([]string, string, string) error          { return nil }
func (noopEmailService) SendOrderConfirmation(string, uint, float64) error { return nil }
func (noopEmailService) SendLicenseDelivery(string, uint, []string) error  { return nil }
func (noopEmailService) SendWelcomeEmail(string, string) error             { return nil }
func (noopEmailService) SendCombinedOrderFulfillment(string, uint, float64, []string) error {
	return nil
}
func (noopEmailService) SendSupportReply(string, string, string) error { return nil }
func (noopEmailService) SendCartRecovery(string, int, float64) error   { return nil }

var Mailer EmailService = noopEmailService{}

func InitMailer() {
	Mailer = NewEmailService(config.AppConfig)
}
