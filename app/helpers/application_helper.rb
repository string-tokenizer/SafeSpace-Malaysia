module ApplicationHelper
  # Bootstrap nav item with "active" state
  def nav_link(label, path)
    css = current_page?(path) ? "nav-link active" : "nav-link"
    content_tag(:li, link_to(label, path, class: css), class: "nav-item")
  end

  # Reusable Bootstrap card inside a grid column
  def info_card(title, &block)
    content_tag(:div, class: "col") do
      content_tag(:div, class: "card h-100 border-0 shadow-sm") do
        content_tag(:div, class: "card-body p-4") do
          content_tag(:h3, title, class: "card-title") + capture(&block)
        end
      end
    end
  end
end
