import pandas as pd
import numpy as np
import json
from typing import Dict, Any, List, Optional, Tuple
from scipy import stats
from scipy.stats import normaltest, shapiro, levene, mannwhitneyu, chi2_contingency
from statsmodels.tsa.seasonal import seasonal_decompose
from statsmodels.tsa.stattools import adfuller
from statsmodels.stats.power import ttest_power
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import base64
import io
from app.services.supabase_service import SupabaseService
from app.core.config import settings


class AdvancedAnalyticsService:
    def __init__(self):
        self.supabase_service = SupabaseService()
    
    async def run_statistical_test(self, dataset_data: Any, test_config: Dict[str, Any]) -> Dict[str, Any]:
        """Run various statistical tests"""
        df = await self._load_dataset(dataset_data)
        
        test_type = test_config.get("test_type", "ttest")
        columns = test_config.get("columns", [])
        alpha = test_config.get("alpha", 0.05)
        
        if test_type == "ttest":
            return await self._run_ttest(df, columns, alpha, test_config)
        elif test_type == "chisquare":
            return await self._run_chi_square_test(df, columns, alpha, test_config)
        elif test_type == "anova":
            return await self._run_anova(df, columns, alpha, test_config)
        elif test_type == "correlation":
            return await self._run_correlation_test(df, columns, alpha)
        elif test_type == "normality":
            return await self._run_normality_test(df, columns, alpha)
        elif test_type == "mann_whitney":
            return await self._run_mann_whitney_test(df, columns, alpha, test_config)
        else:
            raise ValueError(f"Unsupported test type: {test_type}")
    
    async def calculate_ab_test(self, test_config: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate A/B test statistics and power analysis"""
        
        # Extract parameters
        control_conversions = test_config.get("control_conversions", 0)
        control_visitors = test_config.get("control_visitors", 0)
        treatment_conversions = test_config.get("treatment_conversions", 0)
        treatment_visitors = test_config.get("treatment_visitors", 0)
        alpha = test_config.get("alpha", 0.05)
        power = test_config.get("power", 0.8)
        
        # Calculate conversion rates
        control_rate = control_conversions / control_visitors if control_visitors > 0 else 0
        treatment_rate = treatment_conversions / treatment_visitors if treatment_visitors > 0 else 0
        
        # Calculate pooled standard error
        pooled_rate = (control_conversions + treatment_conversions) / (control_visitors + treatment_visitors)
        pooled_se = np.sqrt(pooled_rate * (1 - pooled_rate) * (1/control_visitors + 1/treatment_visitors))
        
        # Calculate z-score and p-value
        if pooled_se > 0:
            z_score = (treatment_rate - control_rate) / pooled_se
            p_value = 2 * (1 - stats.norm.cdf(abs(z_score)))
        else:
            z_score = 0
            p_value = 1
        
        # Calculate confidence interval for difference
        diff_se = np.sqrt((control_rate * (1 - control_rate) / control_visitors) + 
                         (treatment_rate * (1 - treatment_rate) / treatment_visitors))
        z_critical = stats.norm.ppf(1 - alpha/2)
        diff = treatment_rate - control_rate
        ci_lower = diff - z_critical * diff_se
        ci_upper = diff + z_critical * diff_se
        
        # Calculate relative lift
        relative_lift = ((treatment_rate - control_rate) / control_rate * 100) if control_rate > 0 else 0
        
        # Power analysis - sample size needed
        effect_size = abs(diff) / np.sqrt(pooled_rate * (1 - pooled_rate))
        required_sample_size = self._calculate_sample_size_proportion(effect_size, alpha, power)
        
        # Statistical significance
        is_significant = p_value < alpha
        
        # Practical significance (you can adjust this threshold)
        practical_threshold = 0.01  # 1% minimum detectable effect
        is_practically_significant = abs(diff) > practical_threshold
        
        return {
            "test_results": {
                "control_rate": float(control_rate),
                "treatment_rate": float(treatment_rate),
                "difference": float(diff),
                "relative_lift_percent": float(relative_lift),
                "z_score": float(z_score),
                "p_value": float(p_value),
                "is_significant": is_significant,
                "alpha": alpha
            },
            "confidence_interval": {
                "lower": float(ci_lower),
                "upper": float(ci_upper),
                "confidence_level": (1 - alpha) * 100
            },
            "power_analysis": {
                "current_power": float(self._calculate_power_proportion(effect_size, control_visitors + treatment_visitors, alpha)),
                "required_sample_size_per_group": int(required_sample_size),
                "effect_size": float(effect_size)
            },
            "practical_significance": {
                "is_practically_significant": is_practically_significant,
                "minimum_detectable_effect": practical_threshold
            },
            "recommendations": self._get_ab_test_recommendations(
                is_significant, is_practically_significant, p_value, required_sample_size, 
                control_visitors + treatment_visitors
            )
        }
    
    async def run_time_series_decomposition(self, dataset_data: Any, time_column: str, value_column: str, 
                                          frequency: Optional[str] = None) -> Dict[str, Any]:
        """Perform time series decomposition"""
        df = await self._load_dataset(dataset_data)
        
        # Prepare time series data
        df[time_column] = pd.to_datetime(df[time_column])
        df = df.sort_values(time_column)
        df.set_index(time_column, inplace=True)
        
        # Handle frequency
        if frequency:
            ts = df[value_column].asfreq(frequency)
        else:
            ts = df[value_column]
        
        # Fill missing values
        ts = ts.fillna(method='forward').fillna(method='backward')
        
        # Perform decomposition
        try:
            decomposition = seasonal_decompose(ts, model='additive', period=None)
            
            # Create visualizations
            fig = make_subplots(
                rows=4, cols=1,
                subplot_titles=['Original', 'Trend', 'Seasonal', 'Residual'],
                vertical_spacing=0.08
            )
            
            # Original series
            fig.add_trace(
                go.Scatter(x=ts.index, y=ts.values, name='Original', line=dict(color='blue')),
                row=1, col=1
            )
            
            # Trend
            fig.add_trace(
                go.Scatter(x=decomposition.trend.index, y=decomposition.trend.values, 
                          name='Trend', line=dict(color='red')),
                row=2, col=1
            )
            
            # Seasonal
            fig.add_trace(
                go.Scatter(x=decomposition.seasonal.index, y=decomposition.seasonal.values, 
                          name='Seasonal', line=dict(color='green')),
                row=3, col=1
            )
            
            # Residual
            fig.add_trace(
                go.Scatter(x=decomposition.resid.index, y=decomposition.resid.values, 
                          name='Residual', line=dict(color='orange')),
                row=4, col=1
            )
            
            fig.update_layout(height=800, showlegend=False, title_text="Time Series Decomposition")
            plot_html = fig.to_html()
            
            # Statistical tests
            adf_result = adfuller(ts.dropna())
            
            # Calculate statistics
            trend_stats = {
                "mean": float(decomposition.trend.mean()),
                "std": float(decomposition.trend.std()),
                "slope": float(np.polyfit(range(len(decomposition.trend.dropna())), 
                                        decomposition.trend.dropna().values, 1)[0])
            }
            
            seasonal_stats = {
                "amplitude": float(decomposition.seasonal.max() - decomposition.seasonal.min()),
                "mean": float(decomposition.seasonal.mean()),
                "std": float(decomposition.seasonal.std())
            }
            
            residual_stats = {
                "mean": float(decomposition.resid.mean()),
                "std": float(decomposition.resid.std()),
                "autocorrelation": float(decomposition.resid.autocorr())
            }
            
            return {
                "decomposition_components": {
                    "trend": decomposition.trend.dropna().to_dict(),
                    "seasonal": decomposition.seasonal.to_dict(),
                    "residual": decomposition.resid.dropna().to_dict()
                },
                "statistics": {
                    "trend": trend_stats,
                    "seasonal": seasonal_stats,
                    "residual": residual_stats,
                    "stationarity_test": {
                        "adf_statistic": float(adf_result[0]),
                        "p_value": float(adf_result[1]),
                        "is_stationary": adf_result[1] < 0.05,
                        "critical_values": {k: float(v) for k, v in adf_result[4].items()}
                    }
                },
                "visualization": plot_html,
                "insights": self._generate_time_series_insights(decomposition, adf_result)
            }
            
        except Exception as e:
            return {
                "error": f"Time series decomposition failed: {str(e)}",
                "suggestions": [
                    "Ensure the time series has sufficient data points",
                    "Check for missing values in the time column",
                    "Verify the data is properly ordered by time"
                ]
            }
    
    async def generate_comprehensive_report(self, dataset_data: Any, config: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate a comprehensive EDA report"""
        df = await self._load_dataset(dataset_data)
        
        config = config or {}
        include_plots = config.get("include_plots", True)
        target_column = config.get("target_column")
        
        report = {
            "dataset_overview": self._get_dataset_overview(df),
            "data_quality": self._assess_data_quality(df),
            "statistical_summary": self._get_statistical_summary(df),
            "correlation_analysis": self._get_correlation_analysis(df),
            "distribution_analysis": self._get_distribution_analysis(df),
            "outlier_analysis": await self._get_outlier_analysis(df),
            "missing_value_analysis": self._get_missing_value_analysis(df)
        }
        
        if target_column and target_column in df.columns:
            report["target_analysis"] = self._analyze_target_variable(df, target_column)
        
        if include_plots:
            report["visualizations"] = await self._generate_eda_plots(df, target_column)
        
        # Generate insights and recommendations
        report["insights"] = self._generate_insights(df, report)
        report["recommendations"] = self._generate_recommendations(df, report)
        
        return report
    
    # Helper methods
    async def _load_dataset(self, dataset_data: Any) -> pd.DataFrame:
        """Load dataset from storage"""
        file_content = await self.supabase_service.download_file(
            bucket=settings.supabase_storage_bucket,
            path=dataset_data.file_path
        )
        
        if dataset_data.file_type == "csv":
            return pd.read_csv(file_content)
        elif dataset_data.file_type in ["xlsx", "xls"]:
            return pd.read_excel(file_content)
        elif dataset_data.file_type == "json":
            return pd.read_json(file_content)
        elif dataset_data.file_type == "parquet":
            return pd.read_parquet(file_content)
        else:
            raise ValueError(f"Unsupported file type: {dataset_data.file_type}")
    
    async def _run_ttest(self, df: pd.DataFrame, columns: List[str], alpha: float, config: Dict) -> Dict[str, Any]:
        """Run t-test"""
        if len(columns) != 2:
            raise ValueError("T-test requires exactly 2 columns")
        
        col1, col2 = columns
        data1 = df[col1].dropna()
        data2 = df[col2].dropna()
        
        # Test assumptions
        normality1 = normaltest(data1)
        normality2 = normaltest(data2)
        variance_test = levene(data1, data2)
        
        # Choose appropriate test
        if normality1.pvalue > 0.05 and normality2.pvalue > 0.05 and variance_test.pvalue > 0.05:
            # Independent t-test with equal variances
            statistic, p_value = stats.ttest_ind(data1, data2, equal_var=True)
            test_used = "Independent t-test (equal variances)"
        elif normality1.pvalue > 0.05 and normality2.pvalue > 0.05:
            # Welch's t-test (unequal variances)
            statistic, p_value = stats.ttest_ind(data1, data2, equal_var=False)
            test_used = "Welch's t-test (unequal variances)"
        else:
            # Mann-Whitney U test (non-parametric)
            statistic, p_value = mannwhitneyu(data1, data2, alternative='two-sided')
            test_used = "Mann-Whitney U test (non-parametric)"
        
        # Effect size (Cohen's d)
        pooled_std = np.sqrt(((len(data1) - 1) * data1.var() + (len(data2) - 1) * data2.var()) / 
                            (len(data1) + len(data2) - 2))
        cohens_d = (data1.mean() - data2.mean()) / pooled_std if pooled_std > 0 else 0
        
        return {
            "test_type": "t-test",
            "test_used": test_used,
            "statistic": float(statistic),
            "p_value": float(p_value),
            "is_significant": p_value < alpha,
            "alpha": alpha,
            "effect_size": {
                "cohens_d": float(cohens_d),
                "interpretation": self._interpret_cohens_d(cohens_d)
            },
            "assumptions": {
                "normality_col1": {
                    "statistic": float(normality1.statistic),
                    "p_value": float(normality1.pvalue),
                    "assumption_met": normality1.pvalue > 0.05
                },
                "normality_col2": {
                    "statistic": float(normality2.statistic),
                    "p_value": float(normality2.pvalue),
                    "assumption_met": normality2.pvalue > 0.05
                },
                "equal_variances": {
                    "statistic": float(variance_test.statistic),
                    "p_value": float(variance_test.pvalue),
                    "assumption_met": variance_test.pvalue > 0.05
                }
            },
            "descriptive_stats": {
                col1: {
                    "mean": float(data1.mean()),
                    "std": float(data1.std()),
                    "n": len(data1)
                },
                col2: {
                    "mean": float(data2.mean()),
                    "std": float(data2.std()),
                    "n": len(data2)
                }
            }
        }
    
    async def _run_chi_square_test(self, df: pd.DataFrame, columns: List[str], alpha: float, config: Dict) -> Dict[str, Any]:
        """Run chi-square test of independence"""
        if len(columns) != 2:
            raise ValueError("Chi-square test requires exactly 2 columns")
        
        col1, col2 = columns
        
        # Create contingency table
        contingency_table = pd.crosstab(df[col1], df[col2])
        
        # Perform chi-square test
        chi2_stat, p_value, dof, expected = chi2_contingency(contingency_table)
        
        # Calculate Cramér's V (effect size)
        n = contingency_table.sum().sum()
        cramers_v = np.sqrt(chi2_stat / (n * (min(contingency_table.shape) - 1)))
        
        # Check assumptions
        min_expected = expected.min()
        cells_below_5 = (expected < 5).sum().sum()
        total_cells = expected.size
        
        return {
            "test_type": "chi_square",
            "statistic": float(chi2_stat),
            "p_value": float(p_value),
            "degrees_of_freedom": int(dof),
            "is_significant": p_value < alpha,
            "alpha": alpha,
            "effect_size": {
                "cramers_v": float(cramers_v),
                "interpretation": self._interpret_cramers_v(cramers_v)
            },
            "contingency_table": contingency_table.to_dict(),
            "expected_frequencies": pd.DataFrame(expected, 
                                               index=contingency_table.index,
                                               columns=contingency_table.columns).to_dict(),
            "assumptions": {
                "min_expected_frequency": float(min_expected),
                "cells_below_5": int(cells_below_5),
                "percentage_cells_below_5": float(cells_below_5 / total_cells * 100),
                "assumption_met": min_expected >= 5 and (cells_below_5 / total_cells) < 0.2
            }
        }
    
    async def _run_anova(self, df: pd.DataFrame, columns: List[str], alpha: float, config: Dict) -> Dict[str, Any]:
        """Run one-way ANOVA"""
        if len(columns) < 2:
            raise ValueError("ANOVA requires at least 2 groups")
        
        groups = [df[col].dropna() for col in columns]
        
        # Perform ANOVA
        f_stat, p_value = stats.f_oneway(*groups)
        
        # Calculate eta-squared (effect size)
        grand_mean = np.concatenate(groups).mean()
        ss_between = sum(len(group) * (group.mean() - grand_mean)**2 for group in groups)
        ss_total = sum(sum((x - grand_mean)**2 for x in group) for group in groups)
        eta_squared = ss_between / ss_total if ss_total > 0 else 0
        
        # Test assumptions
        normality_tests = [normaltest(group) for group in groups]
        levene_stat, levene_p = levene(*groups)
        
        return {
            "test_type": "anova",
            "f_statistic": float(f_stat),
            "p_value": float(p_value),
            "is_significant": p_value < alpha,
            "alpha": alpha,
            "degrees_of_freedom": {
                "between": len(groups) - 1,
                "within": sum(len(group) for group in groups) - len(groups)
            },
            "effect_size": {
                "eta_squared": float(eta_squared),
                "interpretation": self._interpret_eta_squared(eta_squared)
            },
            "group_statistics": {
                columns[i]: {
                    "mean": float(group.mean()),
                    "std": float(group.std()),
                    "n": len(group)
                } for i, group in enumerate(groups)
            },
            "assumptions": {
                "normality": [
                    {
                        "group": columns[i],
                        "statistic": float(test.statistic),
                        "p_value": float(test.pvalue),
                        "assumption_met": test.pvalue > 0.05
                    } for i, test in enumerate(normality_tests)
                ],
                "equal_variances": {
                    "statistic": float(levene_stat),
                    "p_value": float(levene_p),
                    "assumption_met": levene_p > 0.05
                }
            }
        }
    
    async def _run_correlation_test(self, df: pd.DataFrame, columns: List[str], alpha: float) -> Dict[str, Any]:
        """Run correlation analysis"""
        numerical_cols = df[columns].select_dtypes(include=[np.number]).columns
        
        if len(numerical_cols) < 2:
            raise ValueError("Correlation analysis requires at least 2 numerical columns")
        
        # Calculate correlations
        correlation_matrix = df[numerical_cols].corr()
        
        # Calculate p-values
        n = len(df)
        p_values = np.zeros_like(correlation_matrix)
        
        for i in range(len(numerical_cols)):
            for j in range(len(numerical_cols)):
                if i != j:
                    corr = correlation_matrix.iloc[i, j]
                    t_stat = corr * np.sqrt((n - 2) / (1 - corr**2)) if abs(corr) < 1 else 0
                    p_val = 2 * (1 - stats.t.cdf(abs(t_stat), n - 2))
                    p_values[i, j] = p_val
        
        p_value_df = pd.DataFrame(p_values, index=numerical_cols, columns=numerical_cols)
        
        # Find significant correlations
        significant_correlations = []
        for i in range(len(numerical_cols)):
            for j in range(i + 1, len(numerical_cols)):
                col1, col2 = numerical_cols[i], numerical_cols[j]
                corr_val = correlation_matrix.loc[col1, col2]
                p_val = p_value_df.loc[col1, col2]
                
                if p_val < alpha:
                    significant_correlations.append({
                        "variable_1": col1,
                        "variable_2": col2,
                        "correlation": float(corr_val),
                        "p_value": float(p_val),
                        "strength": self._interpret_correlation_strength(abs(corr_val))
                    })
        
        return {
            "test_type": "correlation",
            "correlation_matrix": correlation_matrix.to_dict(),
            "p_value_matrix": p_value_df.to_dict(),
            "significant_correlations": significant_correlations,
            "alpha": alpha,
            "summary": {
                "total_pairs": len(numerical_cols) * (len(numerical_cols) - 1) // 2,
                "significant_pairs": len(significant_correlations),
                "strongest_correlation": max(significant_correlations, 
                                           key=lambda x: abs(x["correlation"]), 
                                           default={"correlation": 0})
            }
        }
    
    async def _run_normality_test(self, df: pd.DataFrame, columns: List[str], alpha: float) -> Dict[str, Any]:
        """Run normality tests"""
        results = {}
        
        for col in columns:
            if df[col].dtype in ['int64', 'float64']:
                data = df[col].dropna()
                
                # D'Agostino and Pearson's test
                dagostino_stat, dagostino_p = normaltest(data)
                
                # Shapiro-Wilk test (for smaller samples)
                if len(data) <= 5000:
                    shapiro_stat, shapiro_p = shapiro(data)
                else:
                    shapiro_stat, shapiro_p = None, None
                
                results[col] = {
                    "dagostino_pearson": {
                        "statistic": float(dagostino_stat),
                        "p_value": float(dagostino_p),
                        "is_normal": dagostino_p > alpha
                    },
                    "shapiro_wilk": {
                        "statistic": float(shapiro_stat) if shapiro_stat else None,
                        "p_value": float(shapiro_p) if shapiro_p else None,
                        "is_normal": shapiro_p > alpha if shapiro_p else None
                    } if shapiro_stat else None,
                    "descriptive_stats": {
                        "mean": float(data.mean()),
                        "std": float(data.std()),
                        "skewness": float(stats.skew(data)),
                        "kurtosis": float(stats.kurtosis(data))
                    }
                }
        
        return {
            "test_type": "normality",
            "results": results,
            "alpha": alpha
        }
    
    async def _run_mann_whitney_test(self, df: pd.DataFrame, columns: List[str], alpha: float, config: Dict) -> Dict[str, Any]:
        """Run Mann-Whitney U test"""
        if len(columns) != 2:
            raise ValueError("Mann-Whitney test requires exactly 2 columns")
        
        col1, col2 = columns
        data1 = df[col1].dropna()
        data2 = df[col2].dropna()
        
        statistic, p_value = mannwhitneyu(data1, data2, alternative='two-sided')
        
        # Calculate effect size (rank biserial correlation)
        n1, n2 = len(data1), len(data2)
        u1 = statistic
        u2 = n1 * n2 - u1
        r = 1 - (2 * min(u1, u2)) / (n1 * n2)  # rank biserial correlation
        
        return {
            "test_type": "mann_whitney",
            "statistic": float(statistic),
            "p_value": float(p_value),
            "is_significant": p_value < alpha,
            "alpha": alpha,
            "effect_size": {
                "rank_biserial_correlation": float(r),
                "interpretation": self._interpret_rank_biserial(r)
            },
            "descriptive_stats": {
                col1: {
                    "median": float(data1.median()),
                    "iqr": float(data1.quantile(0.75) - data1.quantile(0.25)),
                    "n": len(data1)
                },
                col2: {
                    "median": float(data2.median()),
                    "iqr": float(data2.quantile(0.75) - data2.quantile(0.25)),
                    "n": len(data2)
                }
            }
        }
    
    def _calculate_sample_size_proportion(self, effect_size: float, alpha: float, power: float) -> int:
        """Calculate required sample size for proportion test"""
        from statsmodels.stats.power import zt_ind_solve_power
        
        try:
            n = zt_ind_solve_power(effect_size=effect_size, nobs1=None, alpha=alpha, power=power)
            return max(int(np.ceil(n)), 10)
        except:
            return 100  # Default fallback
    
    def _calculate_power_proportion(self, effect_size: float, sample_size: int, alpha: float) -> float:
        """Calculate statistical power for proportion test"""
        from statsmodels.stats.power import zt_ind_solve_power
        
        try:
            power = zt_ind_solve_power(effect_size=effect_size, nobs1=sample_size/2, alpha=alpha, power=None)
            return min(max(power, 0), 1)
        except:
            return 0.5  # Default fallback
    
    def _get_ab_test_recommendations(self, is_significant: bool, is_practically_significant: bool, 
                                   p_value: float, required_sample: int, current_sample: int) -> List[str]:
        """Generate A/B test recommendations"""
        recommendations = []
        
        if is_significant and is_practically_significant:
            recommendations.append("✅ Test shows both statistical and practical significance. Consider implementing the treatment.")
        elif is_significant and not is_practically_significant:
            recommendations.append("⚠️ Test is statistically significant but may not have practical impact.")
        elif not is_significant:
            if current_sample < required_sample:
                recommendations.append(f"📊 Collect more data. You need ~{required_sample} total samples for adequate power.")
            else:
                recommendations.append("❌ No significant difference detected with adequate sample size.")
        
        if p_value > 0.05 and p_value < 0.1:
            recommendations.append("🔍 Results are marginally significant. Consider extending the test.")
        
        return recommendations
    
    def _interpret_cohens_d(self, d: float) -> str:
        """Interpret Cohen's d effect size"""
        abs_d = abs(d)
        if abs_d < 0.2:
            return "negligible"
        elif abs_d < 0.5:
            return "small"
        elif abs_d < 0.8:
            return "medium"
        else:
            return "large"
    
    def _interpret_cramers_v(self, v: float) -> str:
        """Interpret Cramér's V effect size"""
        if v < 0.1:
            return "negligible"
        elif v < 0.3:
            return "small"
        elif v < 0.5:
            return "medium"
        else:
            return "large"
    
    def _interpret_eta_squared(self, eta: float) -> str:
        """Interpret eta-squared effect size"""
        if eta < 0.01:
            return "negligible"
        elif eta < 0.06:
            return "small"
        elif eta < 0.14:
            return "medium"
        else:
            return "large"
    
    def _interpret_correlation_strength(self, r: float) -> str:
        """Interpret correlation strength"""
        if r < 0.1:
            return "negligible"
        elif r < 0.3:
            return "small"
        elif r < 0.5:
            return "medium"
        elif r < 0.7:
            return "large"
        else:
            return "very large"
    
    def _interpret_rank_biserial(self, r: float) -> str:
        """Interpret rank-biserial correlation"""
        abs_r = abs(r)
        if abs_r < 0.1:
            return "negligible"
        elif abs_r < 0.3:
            return "small"
        elif abs_r < 0.5:
            return "medium"
        else:
            return "large"
    
    def _generate_time_series_insights(self, decomposition, adf_result) -> List[str]:
        """Generate insights from time series decomposition"""
        insights = []
        
        # Trend insights
        trend_slope = np.polyfit(range(len(decomposition.trend.dropna())), 
                               decomposition.trend.dropna().values, 1)[0]
        
        if abs(trend_slope) > 0.01:
            direction = "increasing" if trend_slope > 0 else "decreasing"
            insights.append(f"📈 Clear {direction} trend detected (slope: {trend_slope:.4f})")
        else:
            insights.append("➡️ No significant trend detected")
        
        # Seasonality insights
        seasonal_amplitude = decomposition.seasonal.max() - decomposition.seasonal.min()
        if seasonal_amplitude > decomposition.observed.std() * 0.1:
            insights.append(f"🔄 Strong seasonal pattern detected (amplitude: {seasonal_amplitude:.2f})")
        
        # Stationarity insights
        if adf_result[1] < 0.05:
            insights.append("✅ Time series is stationary")
        else:
            insights.append("⚠️ Time series is non-stationary - consider differencing or detrending")
        
        return insights
    
    def _get_dataset_overview(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Get basic dataset overview"""
        return {
            "shape": df.shape,
            "columns": list(df.columns),
            "data_types": df.dtypes.value_counts().to_dict(),
            "memory_usage": f"{df.memory_usage(deep=True).sum() / 1024 / 1024:.2f} MB"
        }
    
    def _assess_data_quality(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Assess overall data quality"""
        total_cells = df.shape[0] * df.shape[1]
        missing_cells = df.isnull().sum().sum()
        duplicate_rows = df.duplicated().sum()
        
        # Calculate quality score
        quality_score = 100
        quality_score -= (missing_cells / total_cells) * 30  # 30% penalty for missing data
        quality_score -= (duplicate_rows / len(df)) * 20     # 20% penalty for duplicates
        
        return {
            "quality_score": max(0, quality_score),
            "missing_data_percentage": (missing_cells / total_cells) * 100,
            "duplicate_rows": duplicate_rows,
            "duplicate_percentage": (duplicate_rows / len(df)) * 100,
            "completeness": ((total_cells - missing_cells) / total_cells) * 100
        }
    
    def _get_statistical_summary(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Get statistical summary"""
        numerical_cols = df.select_dtypes(include=[np.number]).columns
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns
        
        summary = {
            "numerical_summary": df[numerical_cols].describe().to_dict() if len(numerical_cols) > 0 else {},
            "categorical_summary": {}
        }
        
        for col in categorical_cols:
            summary["categorical_summary"][col] = {
                "unique_count": df[col].nunique(),
                "most_frequent": df[col].mode().iloc[0] if len(df[col].mode()) > 0 else None,
                "frequency": df[col].value_counts().head().to_dict()
            }
        
        return summary
    
    def _get_correlation_analysis(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Get correlation analysis"""
        numerical_cols = df.select_dtypes(include=[np.number]).columns
        
        if len(numerical_cols) < 2:
            return {"message": "Insufficient numerical columns for correlation analysis"}
        
        corr_matrix = df[numerical_cols].corr()
        
        # Find strongest correlations
        correlations = []
        for i in range(len(numerical_cols)):
            for j in range(i + 1, len(numerical_cols)):
                col1, col2 = numerical_cols[i], numerical_cols[j]
                corr_val = corr_matrix.loc[col1, col2]
                if not np.isnan(corr_val):
                    correlations.append({
                        "variable_1": col1,
                        "variable_2": col2,
                        "correlation": float(corr_val),
                        "strength": self._interpret_correlation_strength(abs(corr_val))
                    })
        
        # Sort by absolute correlation
        correlations.sort(key=lambda x: abs(x["correlation"]), reverse=True)
        
        return {
            "correlation_matrix": corr_matrix.to_dict(),
            "strongest_correlations": correlations[:10],  # Top 10
            "high_correlations": [c for c in correlations if abs(c["correlation"]) > 0.7]
        }
    
    def _get_distribution_analysis(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze distributions of numerical columns"""
        numerical_cols = df.select_dtypes(include=[np.number]).columns
        
        distributions = {}
        for col in numerical_cols:
            data = df[col].dropna()
            if len(data) > 0:
                distributions[col] = {
                    "skewness": float(stats.skew(data)),
                    "kurtosis": float(stats.kurtosis(data)),
                    "normality_test": {
                        "statistic": float(normaltest(data).statistic),
                        "p_value": float(normaltest(data).pvalue),
                        "is_normal": normaltest(data).pvalue > 0.05
                    }
                }
        
        return distributions
    
    async def _get_outlier_analysis(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze outliers in numerical columns"""
        numerical_cols = df.select_dtypes(include=[np.number]).columns
        
        outlier_analysis = {}
        for col in numerical_cols:
            data = df[col].dropna()
            if len(data) > 0:
                Q1 = data.quantile(0.25)
                Q3 = data.quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                
                outliers = data[(data < lower_bound) | (data > upper_bound)]
                
                outlier_analysis[col] = {
                    "outlier_count": len(outliers),
                    "outlier_percentage": (len(outliers) / len(data)) * 100,
                    "lower_bound": float(lower_bound),
                    "upper_bound": float(upper_bound),
                    "outlier_values": outliers.tolist()[:10]  # First 10 outliers
                }
        
        return outlier_analysis
    
    def _get_missing_value_analysis(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze missing values"""
        missing_counts = df.isnull().sum()
        missing_percentages = (missing_counts / len(df)) * 100
        
        return {
            "missing_counts": missing_counts.to_dict(),
            "missing_percentages": missing_percentages.to_dict(),
            "columns_with_missing": missing_counts[missing_counts > 0].to_dict(),
            "total_missing": int(missing_counts.sum()),
            "missing_patterns": df.isnull().value_counts().head().to_dict()
        }
    
    def _analyze_target_variable(self, df: pd.DataFrame, target_column: str) -> Dict[str, Any]:
        """Analyze the target variable"""
        target_data = df[target_column]
        
        analysis = {
            "column_name": target_column,
            "data_type": str(target_data.dtype),
            "missing_count": int(target_data.isnull().sum()),
            "unique_count": int(target_data.nunique())
        }
        
        if target_data.dtype in ['int64', 'float64']:
            # Numerical target
            analysis.update({
                "type": "numerical",
                "statistics": {
                    "mean": float(target_data.mean()),
                    "median": float(target_data.median()),
                    "std": float(target_data.std()),
                    "min": float(target_data.min()),
                    "max": float(target_data.max()),
                    "skewness": float(stats.skew(target_data.dropna())),
                    "kurtosis": float(stats.kurtosis(target_data.dropna()))
                }
            })
        else:
            # Categorical target
            value_counts = target_data.value_counts()
            analysis.update({
                "type": "categorical",
                "value_counts": value_counts.to_dict(),
                "class_balance": {
                    "most_frequent": value_counts.index[0],
                    "least_frequent": value_counts.index[-1],
                    "balance_ratio": float(value_counts.iloc[0] / value_counts.iloc[-1])
                }
            })
        
        return analysis
    
    async def _generate_eda_plots(self, df: pd.DataFrame, target_column: Optional[str] = None) -> Dict[str, str]:
        """Generate EDA visualizations"""
        plots = {}
        
        # Distribution plots for numerical columns
        numerical_cols = df.select_dtypes(include=[np.number]).columns
        if len(numerical_cols) > 0:
            fig = make_subplots(
                rows=min(3, len(numerical_cols)), 
                cols=min(3, (len(numerical_cols) + 2) // 3),
                subplot_titles=list(numerical_cols[:9])
            )
            
            for i, col in enumerate(numerical_cols[:9]):
                row = i // 3 + 1
                col_idx = i % 3 + 1
                
                fig.add_trace(
                    go.Histogram(x=df[col], name=col, showlegend=False),
                    row=row, col=col_idx
                )
            
            fig.update_layout(height=600, title_text="Distribution of Numerical Variables")
            plots["distributions"] = fig.to_html()
        
        # Correlation heatmap
        if len(numerical_cols) > 1:
            corr_matrix = df[numerical_cols].corr()
            fig = go.Figure(data=go.Heatmap(
                z=corr_matrix.values,
                x=corr_matrix.columns,
                y=corr_matrix.index,
                colorscale='RdBu',
                zmid=0
            ))
            fig.update_layout(title="Correlation Matrix", height=500)
            plots["correlation_heatmap"] = fig.to_html()
        
        return plots
    
    def _generate_insights(self, df: pd.DataFrame, report: Dict) -> List[str]:
        """Generate insights from the analysis"""
        insights = []
        
        # Data quality insights
        quality_score = report["data_quality"]["quality_score"]
        if quality_score > 90:
            insights.append("✅ Excellent data quality - minimal missing values and duplicates")
        elif quality_score > 70:
            insights.append("⚠️ Good data quality with some issues to address")
        else:
            insights.append("❌ Poor data quality - significant cleaning needed")
        
        # Missing data insights
        missing_pct = report["data_quality"]["missing_data_percentage"]
        if missing_pct > 20:
            insights.append(f"🔍 High missing data rate ({missing_pct:.1f}%) - consider imputation strategies")
        
        # Correlation insights
        if "strongest_correlations" in report["correlation_analysis"]:
            strong_corrs = [c for c in report["correlation_analysis"]["strongest_correlations"] 
                          if abs(c["correlation"]) > 0.7]
            if strong_corrs:
                insights.append(f"🔗 Found {len(strong_corrs)} strong correlations - potential multicollinearity")
        
        # Distribution insights
        skewed_cols = []
        for col, dist in report["distribution_analysis"].items():
            if abs(dist["skewness"]) > 1:
                skewed_cols.append(col)
        
        if skewed_cols:
            insights.append(f"📊 {len(skewed_cols)} variables are highly skewed - consider transformations")
        
        return insights
    
    def _generate_recommendations(self, df: pd.DataFrame, report: Dict) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        # Data cleaning recommendations
        if report["data_quality"]["duplicate_percentage"] > 5:
            recommendations.append("🧹 Remove duplicate rows to improve data quality")
        
        if report["data_quality"]["missing_data_percentage"] > 10:
            recommendations.append("🔧 Implement missing value imputation strategy")
        
        # Feature engineering recommendations
        numerical_cols = df.select_dtypes(include=[np.number]).columns
        if len(numerical_cols) > 5:
            recommendations.append("⚙️ Consider feature selection to reduce dimensionality")
        
        # Modeling recommendations
        if "high_correlations" in report["correlation_analysis"] and len(report["correlation_analysis"]["high_correlations"]) > 0:
            recommendations.append("🎯 Address multicollinearity before modeling")
        
        # Visualization recommendations
        recommendations.append("📊 Create additional visualizations for deeper insights")
        
        return recommendations 