const Anchor = ({ children, id }) => (
  <a href={`#${id || children.toLowerCase().replaceAll(" ", "-")}`}>{children}</a>
);

export default Anchor;
