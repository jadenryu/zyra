import Link from 'next/link';
import { ArrowRight, Upload, Sparkles, BarChart3, Database, Brain, Zap, MessageSquare, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="professional-header">
        <div className="container-padding">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="logo">Zyra</div>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/login" className="text-muted hover:text-foreground transition-colors font-medium">
                Sign in
              </Link>
              <Link href="/register" className="btn-primary">
                Get started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section section-padding animate-fade-in">
        <div className="container-padding text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="heading-1">
              Transform your data into{' '}
              <span className="text-brand-600">actionable insights</span>
            </h1>
            <p className="text-large max-w-2xl mx-auto mb-8">
              Zyra is an AI-powered data analysis platform that automates complex data processing, 
              so you can focus on making data-driven decisions that matter.
            </p>
            <div className="flex justify-center gap-4 flex-wrap mb-12">
              <Link href="/register" className="btn-primary text-base px-8 py-4">
                Start analyzing for free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/dashboard" className="btn-secondary text-base px-8 py-4">
                View demo
              </Link>
            </div>
            
            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-8 text-sm text-muted">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-brand-600" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-brand-600" />
                Free for 30 days
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-brand-600" />
                Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-padding animate-slide-up">
        <div className="container-padding">
          <div className="text-center mb-16">
            <h2 className="heading-2 mb-4">Everything you need for modern data analysis</h2>
            <p className="text-large max-w-2xl mx-auto text-muted">
              From data ingestion to model deployment, our platform handles the complexity 
              so you can focus on insights.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="feature-card">
              <div className="icon-container brand">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="heading-3 mb-3">Smart Data Upload</h3>
              <p className="text-muted">
                Drag and drop your CSV, Excel, JSON, or Parquet files. Our AI automatically 
                detects data types and suggests optimizations.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="icon-container brand">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="heading-3 mb-3">Automated Cleaning</h3>
              <p className="text-muted">
                Advanced algorithms identify and fix data quality issues, handle missing values, 
                and remove duplicates automatically.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="icon-container brand">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="heading-3 mb-3">Interactive Visualizations</h3>
              <p className="text-muted">
                Generate publication-ready charts, correlation matrices, and statistical 
                summaries with intelligent defaults.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="icon-container brand">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="heading-3 mb-3">AutoML Pipeline</h3>
              <p className="text-muted">
                Train and compare multiple machine learning models with automated 
                hyperparameter tuning and cross-validation.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="icon-container brand">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="heading-3 mb-3">One-Click Deployment</h3>
              <p className="text-muted">
                Deploy models as REST APIs instantly or export complete pipelines 
                as Python notebooks for production use.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="icon-container brand">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="heading-3 mb-3">AI Assistant</h3>
              <p className="text-muted">
                Get contextual insights, recommendations, and explanations about 
                your data through natural language conversations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="section-padding bg-muted">
        <div className="container-padding text-center">
          <h2 className="heading-2 mb-8">Trusted by data teams worldwide</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="professional-card">
              <div className="text-4xl font-bold text-brand-600 mb-2">10,000+</div>
              <div className="text-muted">Datasets processed</div>
            </div>
            <div className="professional-card">
              <div className="text-4xl font-bold text-brand-600 mb-2">500+</div>
              <div className="text-muted">Companies using Zyra</div>
            </div>
            <div className="professional-card">
              <div className="text-4xl font-bold text-brand-600 mb-2">99.9%</div>
              <div className="text-muted">Uptime guarantee</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section section-padding">
        <div className="container-padding text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="heading-2 mb-6">Ready to transform your data workflow?</h2>
            <p className="text-large mb-8 text-muted">
              Join thousands of data professionals who save hours every week with Zyra's 
              automated analysis platform.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link href="/register" className="btn-primary text-base px-8 py-4">
                Start your free trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/contact" className="btn-secondary text-base px-8 py-4">
                Talk to sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background section-padding">
        <div className="container-padding">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="text-2xl font-bold text-brand-400 mb-4">Zyra</div>
              <p className="text-gray-400 mb-6 max-w-sm">
                The AI-powered data analysis platform that makes complex analytics 
                accessible to everyone.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-brand-400 transition-colors">Twitter</a>
                <a href="#" className="text-gray-400 hover:text-brand-400 transition-colors">LinkedIn</a>
                <a href="#" className="text-gray-400 hover:text-brand-400 transition-colors">GitHub</a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-background transition-colors">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-background transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-background transition-colors">Integrations</a></li>
                <li><a href="#" className="text-gray-400 hover:text-background transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-background transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-background transition-colors">Tutorials</a></li>
                <li><a href="#" className="text-gray-400 hover:text-background transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-background transition-colors">Community</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-background transition-colors">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-background transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-background transition-colors">Contact</a></li>
                <li><a href="#" className="text-gray-400 hover:text-background transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} Zyra. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
