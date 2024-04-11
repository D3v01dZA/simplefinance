use std::fmt;

pub struct SliceDisplay<'a, T: 'a>(pub &'a [T]);

impl<'a, T: fmt::Debug + 'a> fmt::Display for SliceDisplay<'a, T> {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let mut first = true;
        for item in self.0 {
            if !first {
                write!(f, ", {:?}", item)?;
            } else {
                write!(f, "{:?}", item)?;
            }
            first = false;
        }
        Ok(())
    }
}