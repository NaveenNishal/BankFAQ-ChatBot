import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="us-container us-py-6">
      <div class="us-text-center us-mb-6">
        <h1>Contact Banking Support</h1>
        <p class="us-text-secondary">Get help with your banking questions and concerns</p>
      </div>
      
      <div class="us-grid-3 us-gap-4 us-mb-6">
        <div class="us-card us-text-center">
          <div class="us-card-body">
            <i class="bi bi-chat-dots" style="font-size: 3rem; color: var(--primary-blue);"></i>
            <h3 class="us-mt-3">Live Chat</h3>
            <p class="us-text-secondary">Chat with our FAQ bot or request human agent</p>
            <button class="us-btn us-btn-primary">Start Chat</button>
          </div>
        </div>
        
        <div class="us-card us-text-center">
          <div class="us-card-body">
            <i class="bi bi-telephone" style="font-size: 3rem; color: var(--primary-blue);"></i>
            <h3 class="us-mt-3">Phone Support</h3>
            <p class="us-text-secondary">Speak directly with a banking specialist</p>
            <button class="us-btn us-btn-primary">Call Now</button>
            <p class="us-text-sm us-mt-2">1-800-324-4357</p>
          </div>
        </div>
        
        <div class="us-card us-text-center">
          <div class="us-card-body">
            <i class="bi bi-envelope" style="font-size: 3rem; color: var(--primary-blue);"></i>
            <h3 class="us-mt-3">Email Support</h3>
            <p class="us-text-secondary">Send us your questions via email</p>
            <button class="us-btn us-btn-primary">Send Email</button>
            <p class="us-text-sm us-mt-2">support&#64;bankfaq.com</p>
          </div>
        </div>
      </div>
      
      <div class="us-card us-card-lg">
        <div class="us-card-body">
          <h3 class="us-mb-4">Support Hours</h3>
          <div class="us-grid-2 us-gap-6">
            <div>
              <h4>Customer Service</h4>
              <ul class="us-list-unstyled">
                <li class="us-flex us-justify-between us-py-2">
                  <span>Monday - Friday</span>
                  <span>7:00 AM - 10:00 PM EST</span>
                </li>
                <li class="us-flex us-justify-between us-py-2">
                  <span>Saturday</span>
                  <span>8:00 AM - 8:00 PM EST</span>
                </li>
                <li class="us-flex us-justify-between us-py-2">
                  <span>Sunday</span>
                  <span>9:00 AM - 6:00 PM EST</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4>Technical Support</h4>
              <ul class="us-list-unstyled">
                <li class="us-flex us-justify-between us-py-2">
                  <span>Monday - Friday</span>
                  <span>8:00 AM - 8:00 PM EST</span>
                </li>
                <li class="us-flex us-justify-between us-py-2">
                  <span>Weekend</span>
                  <span>9:00 AM - 5:00 PM EST</span>
                </li>
                <li class="us-flex us-justify-between us-py-2">
                  <span>FAQ Bot</span>
                  <span>24/7 Available</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ContactSupportComponent {}