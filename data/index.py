import json
import matplotlib.pyplot as plt
import numpy as np

def create_confidence_infographic(json_file_path, output_file='confidence_infographic.png'):
    """
    Creates an infographic showing the number of mappings by confidence ranges.
    
    Args:
        json_file_path (str): Path to the conceptMap.json file
        output_file (str): Output filename for the infographic
    """
    
    # Load JSON data
    with open(json_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Extract confidence values from all mappings
    confidence_values = []
    
    # Navigate through the JSON structure
    for group in data.get('group', []):
        for element in group.get('element', []):
            for target in element.get('target', []):
                confidence = target.get('confidence')
                if confidence is not None:
                    confidence_values.append(confidence)
    
    print(f"Total mappings found: {len(confidence_values)}")
    
    # Define confidence ranges
    confidence_ranges = {
        '> 0.95': (0.95, 1.0),
        '0.90–0.95': (0.90, 0.95),
        '0.70–0.90': (0.70, 0.90),
        '< 0.70': (0.0, 0.70)
    }
    
    # Count mappings in each range
    range_counts = {}
    for range_name, (lower, upper) in confidence_ranges.items():
        if range_name == '> 0.95':
            count = sum(1 for c in confidence_values if c > 0.95)
        elif range_name == '< 0.70':
            count = sum(1 for c in confidence_values if c < 0.70)
        else:
            count = sum(1 for c in confidence_values if lower <= c < upper)
        range_counts[range_name] = count
    
    # Print statistics
    print("\nConfidence Distribution:")
    for range_name, count in range_counts.items():
        percentage = (count / len(confidence_values)) * 100
        print(f"{range_name}: {count} mappings ({percentage:.1f}%)")
    
    # Create infographic
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
    
    # Color scheme
    colors = ['#2E8B57', '#3CB371', '#90EE90', '#F08080']  # Green to red gradient
    
    # Bar chart
    ranges = list(range_counts.keys())
    counts = list(range_counts.values())
    
    bars = ax1.bar(ranges, counts, color=colors, edgecolor='black', linewidth=2)
    ax1.set_title('Number of Mappings by Confidence Range', fontsize=16, fontweight='bold')
    ax1.set_ylabel('Number of Mappings', fontsize=12)
    ax1.set_xlabel('Confidence Range', fontsize=12)
    ax1.grid(axis='y', alpha=0.3, linestyle='--')
    
    # Add count labels on bars
    for bar, count in zip(bars, counts):
        height = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2., height + 0.5,
                f'{count}', ha='center', va='bottom', fontsize=11, fontweight='bold')
    
    # Pie chart
    # Filter out zero values for pie chart
    pie_labels = []
    pie_counts = []
    pie_colors = []
    
    for i, (range_name, count) in enumerate(range_counts.items()):
        if count > 0:
            pie_labels.append(f'{range_name}\n({count})')
            pie_counts.append(count)
            pie_colors.append(colors[i])
    
    wedges, texts, autotexts = ax2.pie(pie_counts, labels=pie_labels, colors=pie_colors,
                                      autopct='%1.1f%%', startangle=90,
                                      textprops={'fontsize': 10})
    
    ax2.set_title('Distribution of Mappings\nby Confidence', fontsize=16, fontweight='bold')
    
    # Style the percentage text
    for autotext in autotexts:
        autotext.set_color('white')
        autotext.set_fontweight('bold')
    
    # Add overall statistics
    stats_text = (
        f'Total Mappings: {len(confidence_values)}\n'
        f'Highest Confidence: {max(confidence_values):.3f}\n'
        f'Lowest Confidence: {min(confidence_values):.3f}\n'
        f'Average Confidence: {np.mean(confidence_values):.3f}'
    )
    
    fig.text(0.02, 0.02, stats_text, fontsize=10, 
             bbox=dict(boxstyle="round,pad=0.5", facecolor="lightgray", alpha=0.7))
    
    # Add a title for the entire figure
    fig.suptitle('Concept Map Confidence Analysis', fontsize=18, fontweight='bold', y=0.98)
    
    plt.tight_layout()
    plt.savefig(output_file, dpi=150, bbox_inches='tight')
    plt.show()
    
    print(f"\nInfographic saved as: {output_file}")
    
    return range_counts, confidence_values

# Example usage
if __name__ == "__main__":
    # Update this path to point to your conceptMap.json file
    json_file_path = "conceptMap.json"
    
    try:
        counts, confidences = create_confidence_infographic(json_file_path)
    except FileNotFoundError:
        print(f"Error: File '{json_file_path}' not found.")
        print("Please update the json_file_path variable to point to your conceptMap.json file")
    except json.JSONDecodeError:
        print(f"Error: '{json_file_path}' is not a valid JSON file")
    except Exception as e:
        print(f"An error occurred: {e}")