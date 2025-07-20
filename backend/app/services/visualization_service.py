import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import plotly.figure_factory as ff
import seaborn as sns
import matplotlib.pyplot as plt
from typing import Dict, Any, List, Optional, Union
import base64
import io
import json
from datetime import datetime
from app.services.supabase_service import SupabaseService
from app.core.config import settings


class VisualizationService:
    def __init__(self):
        self.supabase_service = SupabaseService()
        self.color_palette = [
            '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
            '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
        ]
    
    async def generate_histogram(self, dataset_data: Any, column: str, bins: int = 30, 
                               title: Optional[str] = None) -> Dict[str, Any]:
        """Generate histogram for a numerical column"""
        df = await self._load_dataset(dataset_data)
        
        if column not in df.columns:
            raise ValueError(f"Column '{column}' not found in dataset")
        
        if df[column].dtype not in ['int64', 'float64']:
            raise ValueError(f"Column '{column}' is not numerical")
        
        data = df[column].dropna()
        
        fig = go.Figure(data=[
            go.Histogram(
                x=data,
                nbinsx=bins,
                marker_color=self.color_palette[0],
                opacity=0.7,
                name=column
            )
        ])
        
        fig.update_layout(
            title=title or f'Distribution of {column}',
            xaxis_title=column,
            yaxis_title='Frequency',
            template='plotly_white',
            height=500
        )
        
        # Add statistics annotation
        stats_text = (
            f"Mean: {data.mean():.2f}<br>"
            f"Median: {data.median():.2f}<br>"
            f"Std: {data.std():.2f}<br>"
            f"Count: {len(data)}"
        )
        
        fig.add_annotation(
            x=0.02, y=0.98,
            xref="paper", yref="paper",
            text=stats_text,
            showarrow=False,
            bgcolor="rgba(255,255,255,0.8)",
            bordercolor="black",
            borderwidth=1
        )
        
        return {
            "plot_html": fig.to_html(),
            "plot_json": fig.to_json(),
            "statistics": {
                "mean": float(data.mean()),
                "median": float(data.median()),
                "std": float(data.std()),
                "min": float(data.min()),
                "max": float(data.max()),
                "count": len(data)
            }
        }
    
    async def generate_scatter_plot(self, dataset_data: Any, x_column: str, y_column: str,
                                  color_column: Optional[str] = None, size_column: Optional[str] = None,
                                  title: Optional[str] = None) -> Dict[str, Any]:
        """Generate scatter plot"""
        df = await self._load_dataset(dataset_data)
        
        # Validate columns
        required_cols = [x_column, y_column]
        if color_column:
            required_cols.append(color_column)
        if size_column:
            required_cols.append(size_column)
        
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise ValueError(f"Columns not found: {missing_cols}")
        
        # Create scatter plot
        fig = px.scatter(
            df, 
            x=x_column, 
            y=y_column,
            color=color_column,
            size=size_column,
            title=title or f'{y_column} vs {x_column}',
            template='plotly_white',
            height=500
        )
        
        # Add trend line if both columns are numerical
        if df[x_column].dtype in ['int64', 'float64'] and df[y_column].dtype in ['int64', 'float64']:
            # Calculate correlation
            correlation = df[[x_column, y_column]].corr().iloc[0, 1]
            
            # Add trend line
            z = np.polyfit(df[x_column].dropna(), df[y_column].dropna(), 1)
            p = np.poly1d(z)
            
            x_trend = np.linspace(df[x_column].min(), df[x_column].max(), 100)
            y_trend = p(x_trend)
            
            fig.add_trace(
                go.Scatter(
                    x=x_trend,
                    y=y_trend,
                    mode='lines',
                    name=f'Trend (r={correlation:.3f})',
                    line=dict(color='red', dash='dash')
                )
            )
        
        return {
            "plot_html": fig.to_html(),
            "plot_json": fig.to_json(),
            "correlation": float(correlation) if 'correlation' in locals() else None
        }
    
    async def generate_box_plot(self, dataset_data: Any, column: str, group_by: Optional[str] = None,
                              title: Optional[str] = None) -> Dict[str, Any]:
        """Generate box plot"""
        df = await self._load_dataset(dataset_data)
        
        if column not in df.columns:
            raise ValueError(f"Column '{column}' not found in dataset")
        
        if df[column].dtype not in ['int64', 'float64']:
            raise ValueError(f"Column '{column}' is not numerical")
        
        if group_by:
            fig = px.box(
                df, 
                x=group_by, 
                y=column,
                title=title or f'Box Plot of {column} by {group_by}',
                template='plotly_white',
                height=500
            )
        else:
            fig = go.Figure(data=[
                go.Box(
                    y=df[column],
                    name=column,
                    marker_color=self.color_palette[0]
                )
            ])
            
            fig.update_layout(
                title=title or f'Box Plot of {column}',
                yaxis_title=column,
                template='plotly_white',
                height=500
            )
        
        # Calculate outliers
        Q1 = df[column].quantile(0.25)
        Q3 = df[column].quantile(0.75)
        IQR = Q3 - Q1
        outliers = df[(df[column] < Q1 - 1.5 * IQR) | (df[column] > Q3 + 1.5 * IQR)][column]
        
        return {
            "plot_html": fig.to_html(),
            "plot_json": fig.to_json(),
            "outlier_info": {
                "outlier_count": len(outliers),
                "outlier_percentage": (len(outliers) / len(df)) * 100,
                "outlier_values": outliers.tolist()[:20]  # First 20 outliers
            }
        }
    
    async def generate_correlation_heatmap(self, dataset_data: Any, columns: Optional[List[str]] = None,
                                         method: str = 'pearson', title: Optional[str] = None) -> Dict[str, Any]:
        """Generate correlation heatmap"""
        df = await self._load_dataset(dataset_data)
        
        # Select numerical columns
        if columns:
            numerical_cols = [col for col in columns if col in df.columns and df[col].dtype in ['int64', 'float64']]
        else:
            numerical_cols = df.select_dtypes(include=['int64', 'float64']).columns.tolist()
        
        if len(numerical_cols) < 2:
            raise ValueError("Need at least 2 numerical columns for correlation analysis")
        
        # Calculate correlation matrix
        corr_matrix = df[numerical_cols].corr(method=method)
        
        # Create heatmap
        fig = go.Figure(data=go.Heatmap(
            z=corr_matrix.values,
            x=corr_matrix.columns,
            y=corr_matrix.index,
            colorscale='RdBu',
            zmid=0,
            text=np.around(corr_matrix.values, decimals=2),
            texttemplate="%{text}",
            textfont={"size": 10},
            hoverongaps=False
        ))
        
        fig.update_layout(
            title=title or f'{method.title()} Correlation Matrix',
            template='plotly_white',
            height=max(400, len(numerical_cols) * 30),
            width=max(400, len(numerical_cols) * 30)
        )
        
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
        
        correlations.sort(key=lambda x: abs(x["correlation"]), reverse=True)
        
        return {
            "plot_html": fig.to_html(),
            "plot_json": fig.to_json(),
            "correlation_matrix": corr_matrix.to_dict(),
            "strongest_correlations": correlations[:10],
            "high_correlations": [c for c in correlations if abs(c["correlation"]) > 0.7]
        }
    
    async def generate_bar_chart(self, dataset_data: Any, column: str, value_column: Optional[str] = None,
                               top_n: int = 20, title: Optional[str] = None) -> Dict[str, Any]:
        """Generate bar chart for categorical data"""
        df = await self._load_dataset(dataset_data)
        
        if column not in df.columns:
            raise ValueError(f"Column '{column}' not found in dataset")
        
        if value_column:
            # Grouped bar chart
            if value_column not in df.columns:
                raise ValueError(f"Value column '{value_column}' not found in dataset")
            
            grouped_data = df.groupby(column)[value_column].sum().sort_values(ascending=False).head(top_n)
            
            fig = go.Figure(data=[
                go.Bar(
                    x=grouped_data.index,
                    y=grouped_data.values,
                    marker_color=self.color_palette[0]
                )
            ])
            
            fig.update_layout(
                title=title or f'{value_column} by {column}',
                xaxis_title=column,
                yaxis_title=value_column,
                template='plotly_white',
                height=500
            )
        else:
            # Value counts bar chart
            value_counts = df[column].value_counts().head(top_n)
            
            fig = go.Figure(data=[
                go.Bar(
                    x=value_counts.index,
                    y=value_counts.values,
                    marker_color=self.color_palette[0]
                )
            ])
            
            fig.update_layout(
                title=title or f'Distribution of {column}',
                xaxis_title=column,
                yaxis_title='Count',
                template='plotly_white',
                height=500
            )
            
            grouped_data = value_counts
        
        return {
            "plot_html": fig.to_html(),
            "plot_json": fig.to_json(),
            "data_summary": {
                "total_categories": len(grouped_data),
                "top_category": grouped_data.index[0],
                "top_value": float(grouped_data.iloc[0]),
                "distribution": grouped_data.to_dict()
            }
        }
    
    async def generate_line_chart(self, dataset_data: Any, x_column: str, y_column: str,
                                group_by: Optional[str] = None, title: Optional[str] = None) -> Dict[str, Any]:
        """Generate line chart for time series or ordered data"""
        df = await self._load_dataset(dataset_data)
        
        # Validate columns
        required_cols = [x_column, y_column]
        if group_by:
            required_cols.append(group_by)
        
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise ValueError(f"Columns not found: {missing_cols}")
        
        # Sort by x_column
        df_sorted = df.sort_values(x_column)
        
        if group_by:
            fig = px.line(
                df_sorted,
                x=x_column,
                y=y_column,
                color=group_by,
                title=title or f'{y_column} over {x_column}',
                template='plotly_white',
                height=500
            )
        else:
            fig = go.Figure(data=[
                go.Scatter(
                    x=df_sorted[x_column],
                    y=df_sorted[y_column],
                    mode='lines+markers',
                    name=y_column,
                    line=dict(color=self.color_palette[0])
                )
            ])
            
            fig.update_layout(
                title=title or f'{y_column} over {x_column}',
                xaxis_title=x_column,
                yaxis_title=y_column,
                template='plotly_white',
                height=500
            )
        
        return {
            "plot_html": fig.to_html(),
            "plot_json": fig.to_json()
        }
    
    async def generate_pie_chart(self, dataset_data: Any, column: str, top_n: int = 10,
                               title: Optional[str] = None) -> Dict[str, Any]:
        """Generate pie chart for categorical data"""
        df = await self._load_dataset(dataset_data)
        
        if column not in df.columns:
            raise ValueError(f"Column '{column}' not found in dataset")
        
        value_counts = df[column].value_counts().head(top_n)
        
        # Group remaining categories as "Others"
        if len(df[column].value_counts()) > top_n:
            others_count = df[column].value_counts().iloc[top_n:].sum()
            value_counts["Others"] = others_count
        
        fig = go.Figure(data=[
            go.Pie(
                labels=value_counts.index,
                values=value_counts.values,
                hole=0.3,  # Donut chart
                marker_colors=self.color_palette[:len(value_counts)]
            )
        ])
        
        fig.update_layout(
            title=title or f'Distribution of {column}',
            template='plotly_white',
            height=500
        )
        
        return {
            "plot_html": fig.to_html(),
            "plot_json": fig.to_json(),
            "distribution": value_counts.to_dict()
        }
    
    async def generate_feature_importance_plot(self, feature_importance: Dict[str, float],
                                             title: Optional[str] = None, top_n: int = 20) -> Dict[str, Any]:
        """Generate feature importance plot"""
        # Sort features by importance
        sorted_features = sorted(feature_importance.items(), key=lambda x: abs(x[1]), reverse=True)
        top_features = sorted_features[:top_n]
        
        features, importances = zip(*top_features)
        
        fig = go.Figure(data=[
            go.Bar(
                x=list(importances),
                y=list(features),
                orientation='h',
                marker_color=self.color_palette[0]
            )
        ])
        
        fig.update_layout(
            title=title or 'Feature Importance',
            xaxis_title='Importance',
            yaxis_title='Features',
            template='plotly_white',
            height=max(400, len(top_features) * 25)
        )
        
        return {
            "plot_html": fig.to_html(),
            "plot_json": fig.to_json(),
            "top_features": dict(top_features)
        }
    
    async def generate_dashboard(self, dataset_data: Any, config: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate a comprehensive dashboard"""
        df = await self._load_dataset(dataset_data)
        config = config or {}
        
        dashboard_plots = {}
        
        # Dataset overview
        numerical_cols = df.select_dtypes(include=['int64', 'float64']).columns.tolist()
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
        
        # 1. Dataset summary
        summary_fig = self._create_summary_plot(df)
        dashboard_plots["summary"] = summary_fig.to_html()
        
        # 2. Distribution plots for numerical columns
        if len(numerical_cols) > 0:
            dist_fig = self._create_distribution_subplot(df, numerical_cols[:6])
            dashboard_plots["distributions"] = dist_fig.to_html()
        
        # 3. Correlation heatmap
        if len(numerical_cols) > 1:
            corr_result = await self.generate_correlation_heatmap(dataset_data)
            dashboard_plots["correlation"] = corr_result["plot_html"]
        
        # 4. Top categorical distributions
        if len(categorical_cols) > 0:
            cat_fig = self._create_categorical_subplot(df, categorical_cols[:4])
            dashboard_plots["categorical"] = cat_fig.to_html()
        
        # 5. Missing values heatmap
        if df.isnull().sum().sum() > 0:
            missing_fig = self._create_missing_values_plot(df)
            dashboard_plots["missing_values"] = missing_fig.to_html()
        
        # 6. Data quality metrics
        quality_fig = self._create_data_quality_plot(df)
        dashboard_plots["data_quality"] = quality_fig.to_html()
        
        return {
            "dashboard_plots": dashboard_plots,
            "dataset_info": {
                "shape": df.shape,
                "numerical_columns": len(numerical_cols),
                "categorical_columns": len(categorical_cols),
                "missing_values": int(df.isnull().sum().sum()),
                "duplicate_rows": int(df.duplicated().sum())
            }
        }
    
    async def export_report(self, dataset_data: Any, analyses: List[Dict[str, Any]], 
                          format: str = "html") -> str:
        """Export comprehensive analysis report"""
        df = await self._load_dataset(dataset_data)
        
        if format == "html":
            return await self._generate_html_report(df, analyses)
        elif format == "pdf":
            return await self._generate_pdf_report(df, analyses)
        else:
            raise ValueError(f"Unsupported export format: {format}")
    
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
    
    def _create_summary_plot(self, df: pd.DataFrame) -> go.Figure:
        """Create dataset summary visualization"""
        # Data types distribution
        dtype_counts = df.dtypes.value_counts()
        
        fig = make_subplots(
            rows=2, cols=2,
            subplot_titles=['Data Types', 'Missing Values', 'Dataset Shape', 'Memory Usage'],
            specs=[[{"type": "pie"}, {"type": "bar"}],
                   [{"type": "indicator"}, {"type": "indicator"}]]
        )
        
        # Data types pie chart
        fig.add_trace(
            go.Pie(
                labels=dtype_counts.index.astype(str),
                values=dtype_counts.values,
                name="Data Types"
            ),
            row=1, col=1
        )
        
        # Missing values bar chart
        missing_counts = df.isnull().sum().sort_values(ascending=False).head(10)
        if missing_counts.sum() > 0:
            fig.add_trace(
                go.Bar(
                    x=missing_counts.values,
                    y=missing_counts.index,
                    orientation='h',
                    name="Missing Values"
                ),
                row=1, col=2
            )
        
        # Dataset shape indicator
        fig.add_trace(
            go.Indicator(
                mode="number",
                value=df.shape[0],
                title={"text": f"Rows<br><sub>{df.shape[1]} Columns</sub>"},
                number={'font': {'size': 40}}
            ),
            row=2, col=1
        )
        
        # Memory usage indicator
        memory_mb = df.memory_usage(deep=True).sum() / 1024 / 1024
        fig.add_trace(
            go.Indicator(
                mode="number",
                value=memory_mb,
                title={"text": "Memory<br><sub>MB</sub>"},
                number={'font': {'size': 40}, 'suffix': " MB"}
            ),
            row=2, col=2
        )
        
        fig.update_layout(
            title="Dataset Overview",
            height=600,
            showlegend=False
        )
        
        return fig
    
    def _create_distribution_subplot(self, df: pd.DataFrame, columns: List[str]) -> go.Figure:
        """Create subplot of distributions"""
        n_cols = min(3, len(columns))
        n_rows = (len(columns) + n_cols - 1) // n_cols
        
        fig = make_subplots(
            rows=n_rows,
            cols=n_cols,
            subplot_titles=columns
        )
        
        for i, col in enumerate(columns):
            row = i // n_cols + 1
            col_idx = i % n_cols + 1
            
            fig.add_trace(
                go.Histogram(
                    x=df[col],
                    name=col,
                    showlegend=False,
                    marker_color=self.color_palette[i % len(self.color_palette)]
                ),
                row=row,
                col=col_idx
            )
        
        fig.update_layout(
            title="Distribution of Numerical Variables",
            height=200 * n_rows,
            template='plotly_white'
        )
        
        return fig
    
    def _create_categorical_subplot(self, df: pd.DataFrame, columns: List[str]) -> go.Figure:
        """Create subplot of categorical distributions"""
        n_cols = min(2, len(columns))
        n_rows = (len(columns) + n_cols - 1) // n_cols
        
        fig = make_subplots(
            rows=n_rows,
            cols=n_cols,
            subplot_titles=columns
        )
        
        for i, col in enumerate(columns):
            row = i // n_cols + 1
            col_idx = i % n_cols + 1
            
            value_counts = df[col].value_counts().head(10)
            
            fig.add_trace(
                go.Bar(
                    x=value_counts.index,
                    y=value_counts.values,
                    name=col,
                    showlegend=False,
                    marker_color=self.color_palette[i % len(self.color_palette)]
                ),
                row=row,
                col=col_idx
            )
        
        fig.update_layout(
            title="Distribution of Categorical Variables",
            height=300 * n_rows,
            template='plotly_white'
        )
        
        return fig
    
    def _create_missing_values_plot(self, df: pd.DataFrame) -> go.Figure:
        """Create missing values heatmap"""
        # Calculate missing value patterns
        missing_data = df.isnull()
        
        fig = go.Figure(data=go.Heatmap(
            z=missing_data.values.T,
            x=list(range(len(df))),
            y=df.columns,
            colorscale=[[0, 'white'], [1, 'red']],
            showscale=False
        ))
        
        fig.update_layout(
            title="Missing Values Pattern",
            xaxis_title="Row Index",
            yaxis_title="Columns",
            height=max(300, len(df.columns) * 15)
        )
        
        return fig
    
    def _create_data_quality_plot(self, df: pd.DataFrame) -> go.Figure:
        """Create data quality metrics visualization"""
        # Calculate quality metrics
        total_cells = df.shape[0] * df.shape[1]
        missing_cells = df.isnull().sum().sum()
        duplicate_rows = df.duplicated().sum()
        
        completeness = ((total_cells - missing_cells) / total_cells) * 100
        uniqueness = ((len(df) - duplicate_rows) / len(df)) * 100
        
        # Data quality score
        quality_score = (completeness + uniqueness) / 2
        
        fig = go.Figure()
        
        # Gauge chart for overall quality
        fig.add_trace(go.Indicator(
            mode="gauge+number+delta",
            value=quality_score,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Data Quality Score"},
            delta={'reference': 80},
            gauge={
                'axis': {'range': [None, 100]},
                'bar': {'color': "darkblue"},
                'steps': [
                    {'range': [0, 50], 'color': "lightgray"},
                    {'range': [50, 80], 'color': "gray"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 90
                }
            }
        ))
        
        fig.update_layout(
            title="Data Quality Assessment",
            height=400
        )
        
        return fig
    
    async def _generate_html_report(self, df: pd.DataFrame, analyses: List[Dict[str, Any]]) -> str:
        """Generate HTML report"""
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Zyra Data Analysis Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .header {{ background-color: #f0f0f0; padding: 20px; border-radius: 5px; }}
                .section {{ margin: 20px 0; }}
                .metric {{ display: inline-block; margin: 10px; padding: 10px; background-color: #e9ecef; border-radius: 5px; }}
                table {{ border-collapse: collapse; width: 100%; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Zyra Data Analysis Report</h1>
                <p>Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            </div>
            
            <div class="section">
                <h2>Dataset Overview</h2>
                <div class="metric">Rows: {df.shape[0]}</div>
                <div class="metric">Columns: {df.shape[1]}</div>
                <div class="metric">Missing Values: {df.isnull().sum().sum()}</div>
                <div class="metric">Duplicates: {df.duplicated().sum()}</div>
            </div>
            
            <div class="section">
                <h2>Column Information</h2>
                <table>
                    <tr><th>Column</th><th>Type</th><th>Missing</th><th>Unique</th></tr>
        """
        
        for col in df.columns:
            missing_count = df[col].isnull().sum()
            unique_count = df[col].nunique()
            html_content += f"<tr><td>{col}</td><td>{df[col].dtype}</td><td>{missing_count}</td><td>{unique_count}</td></tr>"
        
        html_content += """
                </table>
            </div>
        """
        
        # Add analysis results
        for analysis in analyses:
            html_content += f"""
            <div class="section">
                <h2>{analysis.get('title', 'Analysis')}</h2>
                <div>{analysis.get('plot_html', '')}</div>
            </div>
            """
        
        html_content += """
        </body>
        </html>
        """
        
        return html_content
    
    async def _generate_pdf_report(self, df: pd.DataFrame, analyses: List[Dict[str, Any]]) -> str:
        """Generate PDF report (placeholder - would need additional libraries)"""
        # This would require libraries like reportlab or weasyprint
        # For now, return the HTML content
        return await self._generate_html_report(df, analyses) 